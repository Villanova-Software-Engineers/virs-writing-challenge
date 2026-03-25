from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.auth import require_admin, CurrentUser
from app.core import limiter
from app.core.database import get_db
from app.models import User, WritingSession, Message, Comment

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class UserListItem(BaseModel):
    id: int
    uid: str
    email: str
    first_name: str
    last_name: str
    department: str
    is_admin: bool
    created_at: Optional[str] = None


class UserListResponse(BaseModel):
    users: List[UserListItem]
    total: int


class SetAdminRequest(BaseModel):
    is_admin: bool


class UpdateUserRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None


class WritingSessionResponse(BaseModel):
    id: int
    user_uid: str
    user_name: str
    duration: int
    description: Optional[str] = None
    started_at: str
    ended_at: str
    semester_id: Optional[int] = None
    created_at: str


class SessionsListResponse(BaseModel):
    sessions: List[WritingSessionResponse]
    total_time: int


class MessageUpdateRequest(BaseModel):
    content: str


class PinMessageRequest(BaseModel):
    is_pinned: bool


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/users", response_model=UserListResponse)
@limiter.limit("30/minute;300/hour")
async def list_users(
    request: Request,
    limit: int = 50,
    offset: int = 0,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all users (admin only)"""
    total = db.query(User).count()
    users = db.query(User).order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    return UserListResponse(
        users=[
            UserListItem(
                id=u.id,
                uid=u.uid,
                email=u.email or "",
                first_name=u.first_name or "",
                last_name=u.last_name or "",
                department=u.department or "",
                is_admin=u.is_admin,
                created_at=u.created_at.isoformat() if u.created_at else None,
            )
            for u in users
        ],
        total=total,
    )


@router.patch("/users/{user_id}/admin", response_model=UserListItem)
@limiter.limit("10/minute;100/hour")
async def set_user_admin(
    request: Request,
    user_id: int,
    data: SetAdminRequest,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Set admin status for a user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent removing own admin status
    if user.id == current_user.id and not data.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own admin status"
        )

    user.is_admin = data.is_admin
    db.commit()
    db.refresh(user)

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


@router.get("/users/{user_id}", response_model=UserListItem)
@limiter.limit("60/minute;600/hour")
async def get_user(
    request: Request,
    user_id: int,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get a specific user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

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


@router.patch("/users/{user_id}", response_model=UserListItem)
@limiter.limit("20/minute;200/hour")
async def update_user(
    request: Request,
    user_id: int,
    data: UpdateUserRequest,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update user information (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if data.first_name is not None:
        user.first_name = data.first_name
    if data.last_name is not None:
        user.last_name = data.last_name
    if data.department is not None:
        user.department = data.department

    db.commit()
    db.refresh(user)

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


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute;100/hour")
async def delete_user(
    request: Request,
    user_id: int,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent deleting own account
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    db.delete(user)
    db.commit()
    return None


@router.get("/sessions", response_model=SessionsListResponse)
@limiter.limit("30/minute;300/hour")
async def list_all_sessions(
    request: Request,
    limit: int = 100,
    semester_id: Optional[int] = None,
    user_id: Optional[int] = None,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all writing sessions across all users (admin only)"""
    query = db.query(WritingSession).options(joinedload(WritingSession.user))

    if semester_id:
        query = query.filter(WritingSession.semester_id == semester_id)

    if user_id:
        query = query.filter(WritingSession.user_id == user_id)

    sessions = query.order_by(desc(WritingSession.created_at)).limit(limit).all()

    # Calculate total time
    total_time = sum(s.duration for s in sessions)

    return SessionsListResponse(
        sessions=[
            WritingSessionResponse(
                id=s.id,
                user_uid=s.user.uid if s.user else "",
                user_name=f"{s.user.first_name} {s.user.last_name}" if s.user else "Unknown",
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


@router.patch("/messages/{message_id}", status_code=status.HTTP_200_OK)
@limiter.limit("20/minute;200/hour")
async def admin_update_message(
    request: Request,
    message_id: int,
    data: MessageUpdateRequest,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update any message (admin only)"""
    if not data.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Content cannot be empty")

    message = db.query(Message).filter(Message.id == message_id).first()

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    message.content = data.content.strip()
    db.commit()
    db.refresh(message)

    return {"message": "Message updated successfully"}


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute;200/hour")
async def admin_delete_message(
    request: Request,
    message_id: int,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete any message (admin only)"""
    message = db.query(Message).filter(Message.id == message_id).first()

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    db.delete(message)
    db.commit()
    return None


@router.patch("/messages/{message_id}/pin", status_code=status.HTTP_200_OK)
@limiter.limit("20/minute;200/hour")
async def pin_message(
    request: Request,
    message_id: int,
    data: PinMessageRequest,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Pin or unpin a message (admin only)"""
    message = db.query(Message).filter(Message.id == message_id).first()

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    message.is_pinned = data.is_pinned
    message.pinned_at = datetime.utcnow() if data.is_pinned else None
    db.commit()
    db.refresh(message)

    return {"message": "Message pin status updated successfully"}


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute;200/hour")
async def admin_delete_comment(
    request: Request,
    comment_id: int,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete any comment (admin only)"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()

    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    db.delete(comment)
    db.commit()
    return None
