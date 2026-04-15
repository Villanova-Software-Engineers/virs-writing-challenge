from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Tuple, Optional
from datetime import datetime
from zoneinfo import ZoneInfo
from app.models import User, WritingSession, Message, Comment, Semester
from app.schemas.admin import (
    UserListItem,
    UpdateUserRequest,
    AdminWritingSessionResponse,
    MessageUpdateRequest,
    AdminSessionCreate,
    AdminSessionUpdate,
)


def user_to_list_item(user: User) -> UserListItem:
    return UserListItem(
        id=user.id,
        uid=user.uid,
        email=user.email or "",
        first_name=user.first_name or "",
        last_name=user.last_name or "",
        is_admin=user.is_admin,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


def get_all_users(db: Session, limit: int = 50, offset: int = 0) -> Tuple[List[User], int]:
    total = db.query(User).count()
    users = db.query(User).order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return users, total


def get_user_by_id(user_id: int, db: Session) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def set_user_admin_status(user: User, is_admin: bool, db: Session) -> User:
    user.is_admin = is_admin
    db.commit()
    db.refresh(user)
    return user


def update_user_info(user: User, data: UpdateUserRequest, db: Session) -> User:
    if data.first_name is not None:
        user.first_name = data.first_name
    if data.last_name is not None:
        user.last_name = data.last_name

    db.commit()
    db.refresh(user)
    return user


def delete_user_by_id(user: User, db: Session) -> None:
    db.delete(user)
    db.commit()


def get_all_sessions(
    db: Session,
    limit: int = 100,
    semester_id: Optional[int] = None,
    user_id: Optional[int] = None
) -> Tuple[List[WritingSession], int]:
    
    query = db.query(WritingSession).options(joinedload(WritingSession.user))

    # Filter by exact semester match to prevent showing sessions from deleted semesters
    if semester_id is not None:
        query = query.filter(WritingSession.semester_id == semester_id)
    else:
        # Only sessions with NULL semester_id (no active semester case)
        query = query.filter(WritingSession.semester_id.is_(None))

    if user_id:
        query = query.filter(WritingSession.user_id == user_id)

    sessions = query.order_by(desc(WritingSession.created_at)).limit(limit).all()

    total_time = sum(s.duration for s in sessions)

    return sessions, total_time


def session_to_admin_response(session: WritingSession) -> AdminWritingSessionResponse:
    return AdminWritingSessionResponse(
        id=session.id,
        user_uid=session.user.uid if session.user else "",
        user_name=f"{session.user.first_name} {session.user.last_name}" if session.user else "Unknown",
        duration=session.duration,
        description=session.description,
        started_at=session.started_at.isoformat() if session.started_at else "",
        ended_at=session.ended_at.isoformat() if session.ended_at else "",
        semester_id=session.semester_id,
        created_at=session.created_at.isoformat() if session.created_at else "",
    )


def admin_update_message_content(message: Message, content: str, db: Session) -> Message:
    message.content = content.strip()
    db.commit()
    db.refresh(message)
    return message


def admin_delete_message(message: Message, db: Session) -> None:
    db.delete(message)
    db.commit()


def admin_pin_message(message: Message, is_pinned: bool, db: Session) -> Message:
    message.is_pinned = is_pinned
    message.pinned_at = datetime.utcnow() if is_pinned else None
    db.commit()
    db.refresh(message)
    return message


def admin_delete_comment(comment: Comment, db: Session) -> None:
    db.delete(comment)
    db.commit()


def get_message_by_id(message_id: int, db: Session) -> Optional[Message]:
    return db.query(Message).filter(Message.id == message_id).first()


def get_comment_by_id(comment_id: int, db: Session) -> Optional[Comment]:
    return db.query(Comment).filter(Comment.id == comment_id).first()


def get_session_by_id(session_id: int, db: Session) -> Optional[WritingSession]:
    return db.query(WritingSession).filter(WritingSession.id == session_id).first()


def admin_create_session(data: AdminSessionCreate, db: Session) -> Tuple[WritingSession, Optional[str]]:
    semester = db.query(Semester).filter(Semester.is_active == True).first()

    started_at = datetime.fromisoformat(data.started_at.replace("Z", "+00:00"))
    ended_at = datetime.fromisoformat(data.ended_at.replace("Z", "+00:00"))

    # Convert to EST/EDT timezone for validation
    eastern = ZoneInfo("America/New_York")
    started_at_est = started_at.astimezone(eastern)
    ended_at_est = ended_at.astimezone(eastern)

    # Calculate the end of day (11:59:59 PM EST) for the start date
    end_of_start_day = started_at_est.replace(
        hour=23,
        minute=59,
        second=59,
        microsecond=999999
    )

    warning_message = None

    # Check if the session spans past midnight EST
    if ended_at_est > end_of_start_day:
        # Cap the session at 11:59:59 PM EST
        ended_at = end_of_start_day

        # Recalculate duration based on capped end time
        duration_seconds = int((ended_at - started_at).total_seconds())

        warning_message = (
            "Your time played over 12:00 AM EST. Because of our policy, "
            "we auto-saved your session up to 11:59 PM EST of the day you started. "
            "If this was a mistake, please contact the admin via the message board or email to revert the time."
        )
    else:
        duration_seconds = data.duration

    session = WritingSession(
        user_id=data.user_id,
        duration=duration_seconds,
        description=data.description,
        started_at=started_at,
        ended_at=ended_at,
        semester_id=semester.id if semester else None,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session, warning_message


def admin_update_session(session: WritingSession, data: AdminSessionUpdate, db: Session) -> WritingSession:
    if data.duration is not None:
        session.duration = data.duration
    if data.description is not None:
        session.description = data.description
    if data.started_at is not None:
        session.started_at = datetime.fromisoformat(data.started_at.replace("Z", "+00:00"))
    if data.ended_at is not None:
        session.ended_at = datetime.fromisoformat(data.ended_at.replace("Z", "+00:00"))

    db.commit()
    db.refresh(session)
    return session


def admin_delete_session(session: WritingSession, db: Session) -> None:
    db.delete(session)
    db.commit()
