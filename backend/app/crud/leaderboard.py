from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Semester
from app.schemas.leaderboard import LeaderboardEntry
from app.utils.leaderboard_helpers import (
    get_session_stats,
    get_users_with_streaks,
    build_user_stats,
    add_current_user_if_missing
)


def get_leaderboard(
    db: Session,
    current_user_id: int,
    current_user_uid: str,
    semester_id: Optional[int] = None,
    limit: int = 50
) -> tuple[List[LeaderboardEntry], Optional[int], Optional[str]]:
    """Get ranked leaderboard entries"""
    session_map = get_session_stats(db, semester_id)
    users = get_users_with_streaks(db)
    user_stats = build_user_stats(users, session_map)[:limit]

    entries = [
        LeaderboardEntry(
            rank=idx + 1,
            user_uid=stats["user_uid"],
            user_name=stats["user_name"],
            total_time=stats["total_time"],
            streak=stats["streak"],
            active_days=stats["active_days"],
            is_current_user=stats["user_id"] == current_user_id,
        )
        for idx, stats in enumerate(user_stats)
    ]

    entries = add_current_user_if_missing(db, entries, current_user_id, current_user_uid, semester_id)

    semester_name = None
    if semester_id:
        semester = db.query(Semester).filter(Semester.id == semester_id).first()
        semester_name = semester.name if semester else None

    return entries, semester_id, semester_name
