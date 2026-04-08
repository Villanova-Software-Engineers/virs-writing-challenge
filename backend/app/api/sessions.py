from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import Optional
from app.api.auth import get_current_user, require_semester_registration
from app.schemas.auth import CurrentUser
from app.core import limiter
from app.core.database import get_db
from app.schemas.session import (
    WritingSessionCreate,
    WritingSessionResponse,
    WritingSessionsListResponse,
)
from app.crud.session import (
    create_writing_session,
    get_user_sessions,
    get_today_sessions,
    session_to_response,
)

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("", response_model=WritingSessionResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute;300/hour")
async def create_session(
    request: Request,
    data: WritingSessionCreate,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    if data.duration <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duration must be positive"
        )

    try:
        session = create_writing_session(data, current_user.id, db)
        return session_to_response(session)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid datetime format"
        )


@router.get("", response_model=WritingSessionsListResponse)
@limiter.limit("60/minute;600/hour")
async def get_sessions(
    request: Request,
    limit: int = 20,
    semester_id: Optional[int] = None,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    """Get current user's writing sessions"""
    sessions, total_time = get_user_sessions(current_user.id, db, limit, semester_id)

    return WritingSessionsListResponse(
        sessions=[session_to_response(s) for s in sessions],
        total_time=total_time,
    )


@router.get("/today", response_model=WritingSessionsListResponse)
@limiter.limit("100/minute;1000/hour")
async def get_today_sessions_route(
    request: Request,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    """Get current user's writing sessions for today (EST/EDT)"""
    sessions, total_time = get_today_sessions(current_user.id, db)

    return WritingSessionsListResponse(
        sessions=[session_to_response(s) for s in sessions],
        total_time=total_time,
    )
