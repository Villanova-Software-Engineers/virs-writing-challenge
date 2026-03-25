from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_, and_
from app.auth import get_current_user, CurrentUser
from app.core import limiter
from app.core.database import get_db
from app.models import Message, Comment, User, MessageCategory

router = APIRouter(prefix="/messages", tags=["Messages"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    content: str
    category: str = "win"  # "win" | "gain"


class MessageUpdate(BaseModel):
    content: str


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: str
    author_uid: str
    author_name: str
    author_department: str
    author_is_admin: bool
    content: str
    created_at: str


class MessageResponse(BaseModel):
    id: str
    content: str
    category: str
    author_name: str
    author_department: str
    author_is_admin: bool
    author_uid: str
    created_at: str
    is_pinned: bool = False
    pinned_at: Optional[str] = None
    likes: List[str] = []
    comments: List[CommentResponse] = []


class MessageListResponse(BaseModel):
    messages: List[MessageResponse]
    next_cursor: Optional[str] = None
    has_more: bool = False


# ── Helpers ──────────────────────────────────────────────────────────────────

def message_to_response(msg: Message) -> MessageResponse:
    """Convert SQLAlchemy Message to response schema"""
    return MessageResponse(
        id=str(msg.id),
        content=msg.content,
        category=msg.category.value,
        author_name=msg.author.display_name,
        author_department=msg.author.department or "",
        author_is_admin=msg.author.is_admin,
        author_uid=msg.author.uid,
        created_at=msg.created_at.isoformat() if msg.created_at else "",
        is_pinned=msg.is_pinned,
        pinned_at=msg.pinned_at.isoformat() if msg.pinned_at else None,
        likes=[u.uid for u in msg.liked_by],
        comments=[
            CommentResponse(
                id=str(c.id),
                author_uid=c.author.uid,
                author_name=c.author.display_name,
                author_department=c.author.department or "",
                author_is_admin=c.author.is_admin,
                content=c.content,
                created_at=c.created_at.isoformat() if c.created_at else "",
            )
            for c in msg.comments
        ],
    )


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("", response_model=MessageListResponse)
@limiter.limit("100/minute;1000/hour")
async def get_messages(
    request: Request,
    limit: int = 20,
    cursor: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get messages with cursor-based pagination.

    - limit: Number of messages to return (default: 20, max: 100)
    - cursor: Cursor for pagination (format: "pinned_timestamp_id" or "unpinned_timestamp_id")
    """
    # Limit maximum page size
    limit = min(limit, 100)

    query = (
        db.query(Message)
        .options(
            joinedload(Message.author),
            joinedload(Message.comments).joinedload(Comment.author),
            joinedload(Message.liked_by),
        )
    )

    # Apply cursor-based filtering
    if cursor:
        try:
            # Cursor format: "is_pinned_timestamp_id"
            parts = cursor.split("_", 2)
            if len(parts) == 3:
                is_pinned = parts[0] == "1"
                cursor_timestamp = parts[1]
                cursor_id = int(parts[2])

                # Complex cursor logic: pinned messages first, then by timestamp
                if is_pinned:
                    # If cursor is pinned, get remaining pinned messages or all unpinned
                    query = query.filter(
                        or_(
                            Message.is_pinned == False,
                            and_(
                                Message.is_pinned == True,
                                or_(
                                    Message.created_at < cursor_timestamp,
                                    and_(Message.created_at == cursor_timestamp, Message.id < cursor_id)
                                )
                            )
                        )
                    )
                else:
                    # If cursor is unpinned, only get unpinned messages after cursor
                    query = query.filter(
                        Message.is_pinned == False,
                        or_(
                            Message.created_at < cursor_timestamp,
                            and_(Message.created_at == cursor_timestamp, Message.id < cursor_id)
                        )
                    )
        except (ValueError, IndexError):
            pass  # Invalid cursor, ignore and return from beginning

    query = query.order_by(desc(Message.is_pinned), desc(Message.created_at), desc(Message.id))

    # Fetch limit + 1 to check if there are more messages
    messages = query.limit(limit + 1).all()

    has_more = len(messages) > limit
    if has_more:
        messages = messages[:limit]

    # Generate next cursor from last message
    next_cursor = None
    if has_more and messages:
        last_msg = messages[-1]
        next_cursor = f"{'1' if last_msg.is_pinned else '0'}_{last_msg.created_at.isoformat()}_{last_msg.id}"

    return MessageListResponse(
        messages=[message_to_response(msg) for msg in messages],
        next_cursor=next_cursor,
        has_more=has_more
    )


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute;200/hour")
async def create_message(
    request: Request,
    data: MessageCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not data.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    if data.category not in ("win", "gain"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category must be 'win' or 'gain'")

    # Get user from DB
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    category = MessageCategory.WIN if data.category == "win" else MessageCategory.GAIN

    message = Message(
        content=data.content.strip(),
        category=category,
        author_id=user.id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    # Reload with relationships
    message = (
        db.query(Message)
        .options(
            joinedload(Message.author),
            joinedload(Message.comments),
            joinedload(Message.liked_by),
        )
        .filter(Message.id == message.id)
        .first()
    )

    return message_to_response(message)


@router.patch("/{message_id}", response_model=MessageResponse)
@limiter.limit("30/minute;300/hour")
async def update_message(
    request: Request,
    message_id: int,
    data: MessageUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a message (only by the author)"""
    if not data.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Content cannot be empty")

    message = (
        db.query(Message)
        .options(
            joinedload(Message.author),
            joinedload(Message.comments).joinedload(Comment.author),
            joinedload(Message.liked_by),
        )
        .filter(Message.id == message_id)
        .first()
    )

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    if message.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own messages")

    message.content = data.content.strip()
    db.commit()
    db.refresh(message)

    return message_to_response(message)


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute;200/hour")
async def delete_message(
    request: Request,
    message_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a message (only by the author or admin)"""
    message = db.query(Message).filter(Message.id == message_id).first()

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    if message.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own messages")

    db.delete(message)
    db.commit()
    return None


@router.post("/{message_id}/like", response_model=MessageResponse)
@limiter.limit("60/minute;600/hour")
async def toggle_like(
    request: Request,
    message_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle like on a message"""
    message = (
        db.query(Message)
        .options(
            joinedload(Message.author),
            joinedload(Message.comments).joinedload(Comment.author),
            joinedload(Message.liked_by),
        )
        .filter(Message.id == message_id)
        .first()
    )

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    user = db.query(User).filter(User.id == current_user.id).first()

    if user in message.liked_by:
        message.liked_by.remove(user)
    else:
        message.liked_by.append(user)

    db.commit()
    db.refresh(message)

    return message_to_response(message)


@router.post("/{message_id}/comments", response_model=MessageResponse)
@limiter.limit("30/minute;300/hour")
async def add_comment(
    request: Request,
    message_id: int,
    data: CommentCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a comment to a message"""
    if not data.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment cannot be empty")

    message = db.query(Message).filter(Message.id == message_id).first()

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    comment = Comment(
        content=data.content.strip(),
        message_id=message_id,
        author_id=current_user.id,
    )
    db.add(comment)
    db.commit()

    # Reload message with all relationships
    message = (
        db.query(Message)
        .options(
            joinedload(Message.author),
            joinedload(Message.comments).joinedload(Comment.author),
            joinedload(Message.liked_by),
        )
        .filter(Message.id == message_id)
        .first()
    )

    return message_to_response(message)
