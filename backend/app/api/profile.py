from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.auth import get_current_user, CurrentUser
from app.core import limiter
from app.core.database import get_db
from app.models import User, Streak, WritingSession, Semester

router = APIRouter(prefix="/profile", tags=["Profile"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class SemesterInfo(BaseModel):
    id: int
    name: str
    access_code: str
    is_active: bool


class UserProfileResponse(BaseModel):
    uid: str
    email: Optional[str] = None
    first_name: str
    last_name: str
    department: str
    is_admin: bool = False
    current_semester: Optional[SemesterInfo] = None
    created_at: Optional[str] = None


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None


class UserStats(BaseModel):
    total_time: int  # in seconds
    current_streak: int
    longest_streak: int
    active_days: int
    semester_id: Optional[int] = None
    semester_name: Optional[str] = None


class SemesterStats(BaseModel):
    semester_id: int
    semester_name: str
    total_time: int
    longest_streak: int
    active_days: int


class UserStatsHistory(BaseModel):
    semesters: List[SemesterStats]


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("", response_model=UserProfileResponse)
@limiter.limit("100/minute;1000/hour")
async def get_profile(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's profile"""
    user = db.query(User).filter(User.id == current_user.id).first()

    if not user:
        return UserProfileResponse(
            uid=current_user.uid,
            email=current_user.email,
            first_name="",
            last_name="",
            department="",
            is_admin=current_user.is_admin,
            current_semester=None,
            created_at=None,
        )

    current_semester_info = None
    if user.current_semester_id:
        semester = db.query(Semester).filter(Semester.id == user.current_semester_id).first()
        if semester:
            current_semester_info = SemesterInfo(
                id=semester.id,
                name=semester.name,
                access_code=semester.access_code,
                is_active=semester.is_active,
            )

    return UserProfileResponse(
        uid=user.uid,
        email=user.email,
        first_name=user.first_name or "",
        last_name=user.last_name or "",
        department=user.department or "",
        is_admin=user.is_admin,
        current_semester=current_semester_info,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


@router.patch("", response_model=UserProfileResponse)
@limiter.limit("30/minute;300/hour")
async def update_profile(
    request: Request,
    data: UserProfileUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's profile"""
    user = db.query(User).filter(User.id == current_user.id).first()

    if not user:
        # Create user if doesn't exist
        user = User(
            uid=current_user.uid,
            email=current_user.email or "",
            first_name=data.first_name or "",
            last_name=data.last_name or "",
            department=data.department or "",
        )
        db.add(user)
    else:
        if data.first_name is not None:
            user.first_name = data.first_name
        if data.last_name is not None:
            user.last_name = data.last_name
        if data.department is not None:
            user.department = data.department

    db.commit()
    db.refresh(user)

    current_semester_info = None
    if user.current_semester_id:
        semester = db.query(Semester).filter(Semester.id == user.current_semester_id).first()
        if semester:
            current_semester_info = SemesterInfo(
                id=semester.id,
                name=semester.name,
                access_code=semester.access_code,
                is_active=semester.is_active,
            )

    return UserProfileResponse(
        uid=user.uid,
        email=user.email,
        first_name=user.first_name or "",
        last_name=user.last_name or "",
        department=user.department or "",
        is_admin=user.is_admin,
        current_semester=current_semester_info,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


@router.get("/stats", response_model=UserStats)
@limiter.limit("100/minute;1000/hour")
async def get_profile_stats(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's writing statistics"""
    # Get streak info
    streak = db.query(Streak).filter(Streak.user_id == current_user.id).first()

    # Get total writing time from sessions
    total_time_result = db.query(func.sum(WritingSession.duration)).filter(
        WritingSession.user_id == current_user.id
    ).scalar()
    total_time = total_time_result or 0

    # Get active days (distinct dates with writing sessions)
    active_days_result = db.query(func.count(func.distinct(func.date(WritingSession.started_at)))).filter(
        WritingSession.user_id == current_user.id
    ).scalar()
    active_days = active_days_result or 0

    # Get active semester
    active_semester = db.query(Semester).filter(Semester.is_active == True).first()

    return UserStats(
        total_time=total_time,
        current_streak=streak.count if streak else 0,
        longest_streak=streak.longest_streak if streak else 0,
        active_days=active_days,
        semester_id=active_semester.id if active_semester else None,
        semester_name=active_semester.name if active_semester else None,
    )


@router.get("/history", response_model=UserStatsHistory)
@limiter.limit("60/minute;600/hour")
async def get_profile_history(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's historical statistics by semester"""
    # Get all semesters with user's writing sessions
    semesters = db.query(Semester).order_by(Semester.id.desc()).all()

    result = []
    for semester in semesters:
        # Get total time for this semester
        total_time_result = db.query(func.sum(WritingSession.duration)).filter(
            WritingSession.user_id == current_user.id,
            WritingSession.semester_id == semester.id,
        ).scalar()

        # Get active days for this semester
        active_days_result = db.query(func.count(func.distinct(func.date(WritingSession.started_at)))).filter(
            WritingSession.user_id == current_user.id,
            WritingSession.semester_id == semester.id,
        ).scalar()

        total_time = total_time_result or 0
        active_days = active_days_result or 0

        # Only include semesters where user has activity
        if total_time > 0 or active_days > 0:
            result.append(SemesterStats(
                semester_id=semester.id,
                semester_name=semester.name,
                total_time=total_time,
                longest_streak=0,  # Would need separate tracking per semester
                active_days=active_days,
            ))

    return UserStatsHistory(semesters=result)
