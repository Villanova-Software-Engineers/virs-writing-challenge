from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from app.models import User, Streak, WritingSession, Semester
from app.schemas.profile import (
    SemesterInfo,
    UserProfileResponse,
    UserProfileUpdate,
    UserStats,
    SemesterStats,
    UserStatsHistory,
)


def get_semester_info(db: Session, semester_id: Optional[int]) -> Optional[SemesterInfo]:
    """Get semester information by ID"""
    if not semester_id:
        return None

    semester = db.query(Semester).filter(Semester.id == semester_id).first()
    if not semester:
        return None

    return SemesterInfo(
        id=semester.id,
        name=semester.name,
        access_code=semester.access_code,
        is_active=semester.is_active,
    )


def get_user_profile(db: Session, user_id: int, uid: str, email: Optional[str], is_admin: bool) -> UserProfileResponse:
    """Get user profile"""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return UserProfileResponse(
            uid=uid,
            email=email,
            first_name="",
            last_name="",
            is_admin=is_admin,
            current_semester=None,
            created_at=None,
        )

    # Auto-clear semester reference if it's inactive or deleted
    # This prevents users from being stuck asking for semester code on every login
    if user.current_semester_id:
        semester = db.query(Semester).filter(Semester.id == user.current_semester_id).first()
        if not semester or not semester.is_active:
            user.current_semester_id = None
            db.commit()

    current_semester_info = get_semester_info(db, user.current_semester_id)

    return UserProfileResponse(
        uid=user.uid,
        email=user.email,
        first_name=user.first_name or "",
        last_name=user.last_name or "",
        is_admin=user.is_admin,
        current_semester=current_semester_info,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


def update_user_profile(
    db: Session,
    user_id: int,
    uid: str,
    email: Optional[str],
    is_admin: bool,
    data: UserProfileUpdate,
) -> UserProfileResponse:
    """Update user profile"""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        # Create user if doesn't exist
        user = User(
            uid=uid,
            email=email or "",
            first_name=data.first_name or "",
            last_name=data.last_name or "",
        )
        db.add(user)
    else:
        if data.first_name is not None:
            user.first_name = data.first_name
        if data.last_name is not None:
            user.last_name = data.last_name

    db.commit()
    db.refresh(user)

    current_semester_info = get_semester_info(db, user.current_semester_id)

    return UserProfileResponse(
        uid=user.uid,
        email=user.email,
        first_name=user.first_name or "",
        last_name=user.last_name or "",
        is_admin=user.is_admin,
        current_semester=current_semester_info,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


def get_user_stats(db: Session, user_id: int, semester_id: Optional[int] = None) -> UserStats:
    """Get user writing statistics for a specific semester"""
    # Get streak for the current semester
    streak = db.query(Streak).filter(
        Streak.user_id == user_id,
        Streak.semester_id == semester_id
    ).first()

    # Get total time for the current semester
    total_time_result = db.query(func.sum(WritingSession.duration)).filter(
        WritingSession.user_id == user_id,
        WritingSession.semester_id == semester_id
    ).scalar()
    total_time = total_time_result or 0

    # Get active days for the current semester
    active_days_result = db.query(func.count(func.distinct(func.date(WritingSession.started_at)))).filter(
        WritingSession.user_id == user_id,
        WritingSession.semester_id == semester_id
    ).scalar()
    active_days = active_days_result or 0

    # Get semester info
    semester = db.query(Semester).filter(Semester.id == semester_id).first() if semester_id else None

    return UserStats(
        total_time=total_time,
        current_streak=streak.count if streak else 0,
        longest_streak=streak.longest_streak if streak else 0,
        active_days=active_days,
        semester_id=semester.id if semester else None,
        semester_name=semester.name if semester else None,
    )


def get_user_stats_history(db: Session, user_id: int) -> UserStatsHistory:
    semesters = db.query(Semester).order_by(Semester.id.desc()).all()

    result = []
    for semester in semesters:
        total_time_result = db.query(func.sum(WritingSession.duration)).filter(
            WritingSession.user_id == user_id,
            WritingSession.semester_id == semester.id,
        ).scalar()

        active_days_result = db.query(func.count(func.distinct(func.date(WritingSession.started_at)))).filter(
            WritingSession.user_id == user_id,
            WritingSession.semester_id == semester.id,
        ).scalar()

        total_time = total_time_result or 0
        active_days = active_days_result or 0

        if total_time > 0 or active_days > 0:
            result.append(SemesterStats(
                semester_id=semester.id,
                semester_name=semester.name,
                total_time=total_time,
                longest_streak=0,
                active_days=active_days,
            ))

    return UserStatsHistory(semesters=result)
