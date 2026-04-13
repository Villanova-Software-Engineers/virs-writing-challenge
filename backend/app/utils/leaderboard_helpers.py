from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from app.models import User, Streak, WritingSession
from app.schemas.leaderboard import LeaderboardEntry


def get_user_display_name(user) -> str:
    """Get display name for user"""
    if user.first_name or user.last_name:
        return f"{user.first_name or ''} {user.last_name or ''}".strip()
    return user.email.split("@")[0] if user.email else "Anonymous"


def get_session_stats(db: Session, semester_id: Optional[int]) -> Dict[int, Any]:
    """Get aggregated session stats per user"""
    query = db.query(
        WritingSession.user_id,
        func.sum(WritingSession.duration).label("total_time"),
        func.count(func.distinct(func.date(WritingSession.started_at))).label("active_days"),
    )
    # Filter by exact semester match to prevent showing sessions from deleted semesters
    if semester_id is not None:
        query = query.filter(WritingSession.semester_id == semester_id)
    else:
        # Only sessions with NULL semester_id (no active semester case)
        query = query.filter(WritingSession.semester_id.is_(None))

    return {s.user_id: s for s in query.group_by(WritingSession.user_id).all()}


def get_users_with_streaks(db: Session, semester_id: Optional[int] = None) -> List:
    """Get all users with streak data filtered by semester"""
    query = db.query(
        User.id, User.uid, User.first_name, User.last_name, User.email,
        Streak.count.label("streak")
    )
    if semester_id:
        query = query.outerjoin(
            Streak,
            (User.id == Streak.user_id) & (Streak.semester_id == semester_id)
        )
    else:
        query = query.outerjoin(Streak, User.id == Streak.user_id)
    return query.all()


def build_user_stats(users: List, session_map: Dict) -> List[Dict]:
    """Build user stats from users and sessions"""
    stats = []
    for user in users:
        session_data = session_map.get(user.id)
        total_time = session_data.total_time if session_data else 0
        active_days = session_data.active_days if session_data else 0

        if total_time == 0 and (user.streak or 0) == 0:
            continue

        stats.append({
            "user_id": user.id,
            "user_uid": user.uid,
            "user_name": get_user_display_name(user),
            "total_time": total_time,
            "streak": user.streak or 0,
            "active_days": active_days,
        })

    stats.sort(key=lambda x: (-x["streak"], -x["active_days"], -x["total_time"]))
    return stats


def add_current_user_if_missing(
    db: Session, entries: List[LeaderboardEntry],
    current_user_id: int, current_user_uid: str, semester_id: Optional[int]
) -> List[LeaderboardEntry]:
    """Add current user to leaderboard if not in top entries"""
    if any(e.user_uid == current_user_uid for e in entries):
        return entries

    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        return entries

    # Filter streak by semester
    streak_query = db.query(Streak).filter(Streak.user_id == current_user_id)
    if semester_id:
        streak_query = streak_query.filter(Streak.semester_id == semester_id)
    streak = streak_query.first()

    query = db.query(
        func.sum(WritingSession.duration).label("total_time"),
        func.count(func.distinct(func.date(WritingSession.started_at))).label("active_days"),
    ).filter(WritingSession.user_id == current_user_id)

    # Filter by exact semester match to prevent showing sessions from deleted semesters
    if semester_id is not None:
        query = query.filter(WritingSession.semester_id == semester_id)
    else:
        # Only sessions with NULL semester_id (no active semester case)
        query = query.filter(WritingSession.semester_id.is_(None))

    result = query.first()

    entries.append(LeaderboardEntry(
        rank=len(entries) + 1,
        user_uid=user.uid,
        user_name=user.display_name,
        total_time=result.total_time or 0 if result else 0,
        streak=streak.count if streak else 0,
        active_days=result.active_days or 0 if result else 0,
        is_current_user=True,
    ))
    return entries
