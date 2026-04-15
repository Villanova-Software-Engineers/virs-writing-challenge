from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_, and_
from typing import Optional, Tuple, List
from datetime import datetime
from app.models import Message, Comment, User
from app.schemas.message import MessageCreate, MessageUpdate, CommentCreate, MessageResponse, CommentResponse


def message_to_response(msg: Message) -> MessageResponse:
    return MessageResponse(
        id=str(msg.id),
        content=msg.content,
        author_name=msg.author.display_name,
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
                author_is_admin=c.author.is_admin,
                content=c.content,
                created_at=c.created_at.isoformat() if c.created_at else "",
            )
            for c in msg.comments
        ],
    )


def get_messages_paginated(
    db: Session,
    limit: int = 20,
    cursor: Optional[str] = None,
    semester_id: Optional[int] = None
) -> Tuple[List[Message], Optional[str], bool]:

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

    # Filter by semester
    if semester_id:
        query = query.filter(Message.semester_id == semester_id)

    if cursor:
        try:
            parts = cursor.split("_", 2)
            if len(parts) == 3:
                is_pinned = parts[0] == "1"
                cursor_timestamp = datetime.fromisoformat(parts[1])
                cursor_id = int(parts[2])

                if is_pinned:
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
            pass  

    query = query.order_by(desc(Message.is_pinned), desc(Message.created_at), desc(Message.id))

    messages = query.limit(limit + 1).all()

    has_more = len(messages) > limit
    if has_more:
        messages = messages[:limit]

    next_cursor = None
    if has_more and messages:
        last_msg = messages[-1]
        next_cursor = f"{'1' if last_msg.is_pinned else '0'}_{last_msg.created_at.isoformat()}_{last_msg.id}"

    return messages, next_cursor, has_more


def create_message(data: MessageCreate, user_id: int, db: Session, semester_id: Optional[int] = None) -> Message:
    message = Message(
        content=data.content.strip(),
        author_id=user_id,
        semester_id=semester_id,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

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

    return message


def get_message_by_id(message_id: int, db: Session) -> Optional[Message]:
    return (
        db.query(Message)
        .options(
            joinedload(Message.author),
            joinedload(Message.comments).joinedload(Comment.author),
            joinedload(Message.liked_by),
        )
        .filter(Message.id == message_id)
        .first()
    )


def update_message(message: Message, data: MessageUpdate, db: Session) -> Message:
    message.content = data.content.strip()
    db.commit()
    db.refresh(message)
    return message


def delete_message(message: Message, db: Session) -> None:
    db.delete(message)
    db.commit()


def toggle_message_like(message: Message, user: User, db: Session) -> Message:
    if user in message.liked_by:
        message.liked_by.remove(user)
    else:
        message.liked_by.append(user)

    db.commit()
    db.refresh(message)
    return message


def create_comment(message_id: int, data: CommentCreate, user_id: int, db: Session, semester_id: Optional[int] = None) -> Message:
    comment = Comment(
        content=data.content.strip(),
        message_id=message_id,
        author_id=user_id,
        semester_id=semester_id,
    )
    db.add(comment)
    db.commit()

    message = get_message_by_id(message_id, db)
    return message
