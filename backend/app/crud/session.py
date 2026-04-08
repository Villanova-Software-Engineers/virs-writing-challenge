from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from app.models import WritingSession, Semester
from app.schemas.session import WritingSessionCreate, WritingSessionResponse


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
    db: Session
) -> WritingSession:
    semester = db.query(Semester).filter(Semester.is_active == True).first()

    started_at = datetime.fromisoformat(data.started_at.replace("Z", "+00:00"))
    ended_at = datetime.fromisoformat(data.ended_at.replace("Z", "+00:00"))

    session = WritingSession(
        user_id=user_id,
        duration=data.duration,
        description=data.description,
        started_at=started_at,
        ended_at=ended_at,
        semester_id=semester.id if semester else None,
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

    if semester_id:
        query = query.filter(WritingSession.semester_id == semester_id)

    sessions = query.order_by(desc(WritingSession.created_at)).limit(limit).all()
    total_time = sum(s.duration for s in sessions)

    return sessions, total_time


def get_today_sessions(user_id: int, db: Session) -> Tuple[List[WritingSession], int]:
  
    est = timezone(timedelta(hours=-5))
    today_start = datetime.now(est).replace(hour=0, minute=0, second=0, microsecond=0)

    sessions = (
        db.query(WritingSession)
        .filter(WritingSession.user_id == user_id)
        .filter(WritingSession.started_at >= today_start)
        .order_by(desc(WritingSession.created_at))
        .all()
    )

    total_time = sum(s.duration for s in sessions)

    return sessions, total_time
