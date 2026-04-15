from app.api.deps import (
    APIRouter, Depends, HTTPException, Request, status,
    Session, Optional, limiter, get_db,
    CurrentUser, require_semester_registration,
)
from app.schemas.session import (
    WritingSessionCreate,
    WritingSessionResponse,
    WritingSessionsListResponse,
    SessionStateResponse,
    SessionStateUpdate,
)
from app.crud.session import (
    create_writing_session,
    get_user_sessions,
    get_today_sessions,
    session_to_response,
    get_or_create_session_state,
    update_session_state,
    reset_session_state,
    session_state_to_response,
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
        session, warning_message = create_writing_session(data, current_user.id, db, current_user.current_semester_id)
        return session_to_response(session, warning_message)
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
    # If no semester_id provided, use the user's current semester
    effective_semester_id = semester_id if semester_id is not None else current_user.current_semester_id
    sessions, total_time = get_user_sessions(current_user.id, db, limit, effective_semester_id)

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
    sessions, total_time = get_today_sessions(current_user.id, db, current_user.current_semester_id)

    return WritingSessionsListResponse(
        sessions=[session_to_response(s) for s in sessions],
        total_time=total_time,
    )


@router.get("/state", response_model=SessionStateResponse)
@limiter.limit("100/minute;1000/hour")
async def get_session_state_route(
    request: Request,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    """Get current user's session state"""
    state = get_or_create_session_state(current_user.id, db)
    return session_state_to_response(state)


@router.patch("/state", response_model=SessionStateResponse)
@limiter.limit("100/minute;1000/hour")
async def update_session_state_route(
    request: Request,
    data: SessionStateUpdate,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    """Update current user's session state"""
    state = update_session_state(current_user.id, data, db)
    return session_state_to_response(state)


@router.post("/state/reset", response_model=SessionStateResponse)
@limiter.limit("100/minute;1000/hour")
async def reset_session_state_route(
    request: Request,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    """Reset current user's session state"""
    state = reset_session_state(current_user.id, db)
    return session_state_to_response(state)
