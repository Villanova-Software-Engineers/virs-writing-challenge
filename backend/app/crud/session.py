from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Tuple
from datetime import datetime
from zoneinfo import ZoneInfo
from app.models import WritingSession, Semester, SessionState
from app.schemas.session import WritingSessionCreate, WritingSessionResponse, SessionStateResponse, SessionStateUpdate


def session_to_response(session: WritingSession) -> WritingSessionResponse:
    return WritingSessionResponse(
        id=session.id,
        duration=session.duration,
        description=session.description,
        started_at=session.started_at.isoformat() if session.started_at else "",
        ended_at=session.ended_at.isoformat() if session.ended_at else "",
        semester_id=session.semester_id,
        created_at=session.created_at.isoformat() if session.created_at else "",
    )


def create_writing_session(
    data: WritingSessionCreate,
    user_id: int,
    db: Session,
    semester_id: Optional[int] = None
) -> WritingSession:
    # Use provided semester_id (from user's current_semester_id) instead of querying for active semester
    # This prevents sessions from being orphaned when semesters are ended/deleted
    if semester_id is None:
        semester = db.query(Semester).filter(Semester.is_active == True).first()
        semester_id = semester.id if semester else None

    started_at = datetime.fromisoformat(data.started_at.replace("Z", "+00:00"))
    ended_at = datetime.fromisoformat(data.ended_at.replace("Z", "+00:00"))

    session = WritingSession(
        user_id=user_id,
        duration=data.duration,
        description=data.description,
        started_at=started_at,
        ended_at=ended_at,
        semester_id=semester_id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_user_sessions(
    user_id: int,
    db: Session,
    limit: int = 20,
    semester_id: Optional[int] = None
) -> Tuple[List[WritingSession], int]:

    query = db.query(WritingSession).filter(WritingSession.user_id == user_id)

    # Filter by exact semester match to prevent showing sessions from other/deleted semesters
    if semester_id is not None:
        # Only sessions from this specific semester (excludes NULL sessions from deleted semesters)
        query = query.filter(WritingSession.semester_id == semester_id)
    else:
        # Only sessions with NULL semester_id (no active semester case)
        query = query.filter(WritingSession.semester_id.is_(None))

    sessions = query.order_by(desc(WritingSession.created_at)).limit(limit).all()
    total_time = sum(s.duration for s in sessions)

    return sessions, total_time


def get_today_sessions(user_id: int, db: Session, semester_id: Optional[int] = None) -> Tuple[List[WritingSession], int]:
    # Use America/New_York timezone to properly handle EST/EDT transitions
    eastern = ZoneInfo("America/New_York")
    now_eastern = datetime.now(eastern)
    today_start = now_eastern.replace(hour=0, minute=0, second=0, microsecond=0)

    query = (
        db.query(WritingSession)
        .filter(WritingSession.user_id == user_id)
        .filter(WritingSession.started_at >= today_start)
    )

    # Filter by exact semester match to prevent showing sessions from other/deleted semesters
    # When semester is deleted, semester_id becomes NULL, so we need exact matching
    if semester_id is not None:
        # Only sessions from this specific semester (excludes NULL sessions from deleted semesters)
        query = query.filter(WritingSession.semester_id == semester_id)
    else:
        # Only sessions with NULL semester_id (no active semester case)
        query = query.filter(WritingSession.semester_id.is_(None))

    sessions = query.order_by(desc(WritingSession.created_at)).all()

    total_time = sum(s.duration for s in sessions)

    return sessions, total_time


# SessionState CRUD functions
def session_state_to_response(state: SessionState) -> SessionStateResponse:
    return SessionStateResponse(
        id=state.id,
        user_id=state.user_id,
        accumulated_seconds=state.accumulated_seconds,
        description=state.description,
        is_running=state.is_running,
        session_start_time=state.session_start_time.isoformat() if state.session_start_time else None,
        last_pause_time=state.last_pause_time.isoformat() if state.last_pause_time else None,
        created_at=state.created_at.isoformat() if state.created_at else "",
        updated_at=state.updated_at.isoformat() if state.updated_at else "",
    )


def get_or_create_session_state(user_id: int, db: Session) -> SessionState:
    state = db.query(SessionState).filter(SessionState.user_id == user_id).first()
    if not state:
        state = SessionState(user_id=user_id)
        db.add(state)
        db.commit()
        db.refresh(state)
    return state


def update_session_state(
    user_id: int,
    data: SessionStateUpdate,
    db: Session
) -> SessionState:
    state = get_or_create_session_state(user_id, db)

    if data.accumulated_seconds is not None:
        state.accumulated_seconds = data.accumulated_seconds
    if data.description is not None:
        state.description = data.description
    if data.is_running is not None:
        state.is_running = data.is_running
    if data.session_start_time is not None:
        if data.session_start_time:
            state.session_start_time = datetime.fromisoformat(data.session_start_time.replace("Z", "+00:00"))
        else:
            state.session_start_time = None
    if data.last_pause_time is not None:
        if data.last_pause_time:
            state.last_pause_time = datetime.fromisoformat(data.last_pause_time.replace("Z", "+00:00"))
        else:
            state.last_pause_time = None

    db.commit()
    db.refresh(state)
    return state


def reset_session_state(user_id: int, db: Session) -> SessionState:
    state = get_or_create_session_state(user_id, db)
    state.accumulated_seconds = 0
    state.description = None
    state.is_running = False
    state.session_start_time = None
    state.last_pause_time = None
    db.commit()
    db.refresh(state)
    return state
