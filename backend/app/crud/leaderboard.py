from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.models import User, Streak, WritingSession, Semester
from app.schemas.leaderboard import LeaderboardEntry


def get_leaderboard(
    db: Session,
    current_user_id: int,
    current_user_uid: str,
    semester_id: Optional[int] = None,
    limit: int = 50
) -> tuple[List[LeaderboardEntry], Optional[int], Optional[str]]:

    session_query = db.query(
        WritingSession.user_id,
        func.sum(WritingSession.duration).label("total_time"),
        func.count(func.distinct(func.date(WritingSession.started_at))).label("active_days"),
    )

    if semester_id:
        session_query = session_query.filter(WritingSession.semester_id == semester_id)

    session_stats = session_query.group_by(WritingSession.user_id).all()

    users_with_streaks = db.query(
        User.id,
        User.uid,
        User.first_name,
        User.last_name,
        User.email,
        Streak.count.label("streak"),
    ).outerjoin(Streak, User.id == Streak.user_id).all()

    user_map = {u.id: u for u in users_with_streaks}
    session_map = {s.user_id: s for s in session_stats}

    user_stats = []
    for user in users_with_streaks:
        session_data = session_map.get(user.id)
        total_time = session_data.total_time if session_data else 0
        active_days = session_data.active_days if session_data else 0
        streak = user.streak or 0

        if user.first_name or user.last_name:
            display_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
        else:
            display_name = user.email.split("@")[0] if user.email else "Anonymous"

        user_stats.append({
            "user_id": user.id,
            "user_uid": user.uid,
            "user_name": display_name,
            "total_time": total_time,
            "streak": streak,
            "active_days": active_days,
        })

    user_stats.sort(key=lambda x: (-x["total_time"], -x["streak"]))

    user_stats = [u for u in user_stats if u["total_time"] > 0 or u["streak"] > 0]

    user_stats = user_stats[:limit]

    entries = []
    current_user_db_id = int(current_user_id)
    for idx, stats in enumerate(user_stats):
        is_current = int(stats["user_id"]) == current_user_db_id
        entries.append(LeaderboardEntry(
            rank=idx + 1,
            user_uid=stats["user_uid"],
            user_name=stats["user_name"],
            total_time=stats["total_time"],
            streak=stats["streak"],
            active_days=stats["active_days"],
            is_current_user=is_current,
        ))

    current_user_in_list = any(e.user_uid == current_user_uid for e in entries)
    if not current_user_in_list:
        user = db.query(User).filter(User.id == current_user_id).first()
        streak = db.query(Streak).filter(Streak.user_id == current_user_id).first()

        session_data = db.query(
            func.sum(WritingSession.duration).label("total_time"),
            func.count(func.distinct(func.date(WritingSession.started_at))).label("active_days"),
        ).filter(WritingSession.user_id == current_user_id)

        if semester_id:
            session_data = session_data.filter(WritingSession.semester_id == semester_id)

        session_result = session_data.first()

        if user:
            entries.append(LeaderboardEntry(
                rank=len(entries) + 1,
                user_uid=user.uid,
                user_name=user.display_name,
                total_time=session_result.total_time or 0 if session_result else 0,
                streak=streak.count if streak else 0,
                active_days=session_result.active_days or 0 if session_result else 0,
                is_current_user=True,
            ))

    semester = None
    semester_name = None
    if semester_id:
        semester = db.query(Semester).filter(Semester.id == semester_id).first()
        semester_name = semester.name if semester else None

    return entries, semester_id, semester_name
