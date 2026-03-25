from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.auth import get_current_user, CurrentUser
from app.core import limiter
from app.core.database import get_db
from app.models import WritingSession, Semester

router = APIRouter(prefix="/sessions", tags=["Sessions"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class WritingSessionCreate(BaseModel):
    duration: int  # in seconds
    started_at: str  # ISO datetime string
    ended_at: str  # ISO datetime string
    description: Optional[str] = None  # Session description


class WritingSessionResponse(BaseModel):
    id: int
    duration: int
    description: Optional[str] = None
    started_at: str
    ended_at: str
    semester_id: Optional[int] = None
    created_at: str


class WritingSessionsListResponse(BaseModel):
    sessions: List[WritingSessionResponse]
    total_time: int  # Total time in seconds


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("", response_model=WritingSessionResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute;300/hour")
async def create_session(
    request: Request,
    data: WritingSessionCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a new writing session"""
    if data.duration <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duration must be positive"
        )

    # Get active semester
    semester = db.query(Semester).filter(Semester.is_active == True).first()

    # Parse datetime strings
    try:
        started_at = datetime.fromisoformat(data.started_at.replace("Z", "+00:00"))
        ended_at = datetime.fromisoformat(data.ended_at.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid datetime format"
        )

    session = WritingSession(
        user_id=current_user.id,
        duration=data.duration,
        description=data.description,
        started_at=started_at,
        ended_at=ended_at,
        semester_id=semester.id if semester else None,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return WritingSessionResponse(
        id=session.id,
        duration=session.duration,
        description=session.description,
        started_at=session.started_at.isoformat() if session.started_at else "",
        ended_at=session.ended_at.isoformat() if session.ended_at else "",
        semester_id=session.semester_id,
        created_at=session.created_at.isoformat() if session.created_at else "",
    )


@router.get("", response_model=WritingSessionsListResponse)
@limiter.limit("60/minute;600/hour")
async def get_sessions(
    request: Request,
    limit: int = 20,
    semester_id: Optional[int] = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's writing sessions"""
    query = db.query(WritingSession).filter(WritingSession.user_id == current_user.id)

    if semester_id:
        query = query.filter(WritingSession.semester_id == semester_id)

    sessions = query.order_by(desc(WritingSession.created_at)).limit(limit).all()

    # Calculate total time
    total_time = sum(s.duration for s in sessions)

    return WritingSessionsListResponse(
        sessions=[
            WritingSessionResponse(
                id=s.id,
                duration=s.duration,
                description=s.description,
                started_at=s.started_at.isoformat() if s.started_at else "",
                ended_at=s.ended_at.isoformat() if s.ended_at else "",
                semester_id=s.semester_id,
                created_at=s.created_at.isoformat() if s.created_at else "",
            )
            for s in sessions
        ],
        total_time=total_time,
    )


@router.get("/today", response_model=WritingSessionsListResponse)
@limiter.limit("100/minute;1000/hour")
async def get_today_sessions(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's writing sessions for today (EST/EDT)"""
    from datetime import timezone, timedelta
    # EST is UTC-5 (or EDT is UTC-4 during daylight saving time)
    est = timezone(timedelta(hours=-5))
    today_start = datetime.now(est).replace(hour=0, minute=0, second=0, microsecond=0)

    sessions = (
        db.query(WritingSession)
        .filter(WritingSession.user_id == current_user.id)
        .filter(WritingSession.started_at >= today_start)
        .order_by(desc(WritingSession.created_at))
        .all()
    )

    total_time = sum(s.duration for s in sessions)

    return WritingSessionsListResponse(
        sessions=[
            WritingSessionResponse(
                id=s.id,
                duration=s.duration,
                description=s.description,
                started_at=s.started_at.isoformat() if s.started_at else "",
                ended_at=s.ended_at.isoformat() if s.ended_at else "",
                semester_id=s.semester_id,
                created_at=s.created_at.isoformat() if s.created_at else "",
            )
            for s in sessions
        ],
        total_time=total_time,
    )
