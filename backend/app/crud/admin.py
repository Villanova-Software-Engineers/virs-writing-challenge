from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Tuple, Optional
from datetime import datetime
from app.models import User, WritingSession, Message, Comment
from app.schemas.admin import (
    UserListItem,
    UpdateUserRequest,
    AdminWritingSessionResponse,
    MessageUpdateRequest,
)


def user_to_list_item(user: User) -> UserListItem:
    """Convert User model to UserListItem schema"""
    return UserListItem(
        id=user.id,
        uid=user.uid,
        email=user.email or "",
        first_name=user.first_name or "",
        last_name=user.last_name or "",
        department=user.department or "",
        is_admin=user.is_admin,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


def get_all_users(db: Session, limit: int = 50, offset: int = 0) -> Tuple[List[User], int]:
    """
    Get all users with pagination.

    Returns: (users, total_count)
    """
    total = db.query(User).count()
    users = db.query(User).order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return users, total


def get_user_by_id(user_id: int, db: Session) -> Optional[User]:
    """Get a user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def set_user_admin_status(user: User, is_admin: bool, db: Session) -> User:
    """Set admin status for a user"""
    user.is_admin = is_admin
    db.commit()
    db.refresh(user)
    return user


def update_user_info(user: User, data: UpdateUserRequest, db: Session) -> User:
    """Update user information"""
    if data.first_name is not None:
        user.first_name = data.first_name
    if data.last_name is not None:
        user.last_name = data.last_name
    if data.department is not None:
        user.department = data.department

    db.commit()
    db.refresh(user)
    return user


def delete_user_by_id(user: User, db: Session) -> None:
    """Delete a user"""
    db.delete(user)
    db.commit()


def get_all_sessions(
    db: Session,
    limit: int = 100,
    semester_id: Optional[int] = None,
    user_id: Optional[int] = None
) -> Tuple[List[WritingSession], int]:
    """
    Get all writing sessions across all users with optional filters.

    Returns: (sessions, total_time)
    """
    query = db.query(WritingSession).options(joinedload(WritingSession.user))

    if semester_id:
        query = query.filter(WritingSession.semester_id == semester_id)

    if user_id:
        query = query.filter(WritingSession.user_id == user_id)

    sessions = query.order_by(desc(WritingSession.created_at)).limit(limit).all()

    # Calculate total time
    total_time = sum(s.duration for s in sessions)

    return sessions, total_time


def session_to_admin_response(session: WritingSession) -> AdminWritingSessionResponse:
    """Convert WritingSession to admin response format"""
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
    """Update message content (admin only)"""
    message.content = content.strip()
    db.commit()
    db.refresh(message)
    return message


def admin_delete_message(message: Message, db: Session) -> None:
    """Delete a message (admin only)"""
    db.delete(message)
    db.commit()


def admin_pin_message(message: Message, is_pinned: bool, db: Session) -> Message:
    """Pin or unpin a message (admin only)"""
    message.is_pinned = is_pinned
    message.pinned_at = datetime.utcnow() if is_pinned else None
    db.commit()
    db.refresh(message)
    return message


def admin_delete_comment(comment: Comment, db: Session) -> None:
    """Delete a comment (admin only)"""
    db.delete(comment)
    db.commit()


def get_message_by_id(message_id: int, db: Session) -> Optional[Message]:
    """Get a message by ID"""
    return db.query(Message).filter(Message.id == message_id).first()


def get_comment_by_id(comment_id: int, db: Session) -> Optional[Comment]:
    """Get a comment by ID"""
    return db.query(Comment).filter(Comment.id == comment_id).first()
