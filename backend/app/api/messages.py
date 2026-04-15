from app.api.deps import (
    APIRouter, Depends, HTTPException, Request, status,
    Session, Optional, limiter, get_db,
    CurrentUser, require_semester_registration,
)
from app.models import User
from app.schemas.message import (
    MessageCreate,
    MessageUpdate,
    CommentCreate,
    MessageResponse,
    MessageListResponse,
)
from app.crud.message import (
    get_messages_paginated,
    create_message,
    get_message_by_id,
    update_message,
    delete_message,
    toggle_message_like,
    create_comment,
    message_to_response,
)

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("", response_model=MessageListResponse)
@limiter.limit("100/minute;1000/hour")
async def get_messages(
    request: Request,
    limit: int = 20,
    cursor: Optional[str] = None,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    """
    Get messages with cursor-based pagination.

    - limit: Number of messages to return (default: 20, max: 100)
    - cursor: Cursor for pagination (format: "pinned_timestamp_id" or "unpinned_timestamp_id")
    """
    messages, next_cursor, has_more = get_messages_paginated(
        db, limit, cursor, current_user.current_semester_id
    )

    return MessageListResponse(
        messages=[message_to_response(msg) for msg in messages],
        next_cursor=next_cursor,
        has_more=has_more
    )


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute;200/hour")
async def create_message_route(
    request: Request,
    data: MessageCreate,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    if not data.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    # Get user from DB
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    message = create_message(data, user.id, db, current_user.current_semester_id)
    return message_to_response(message)


@router.patch("/{message_id}", response_model=MessageResponse)
@limiter.limit("30/minute;300/hour")
async def update_message_route(
    request: Request,
    message_id: int,
    data: MessageUpdate,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    """Update a message (only by the author)"""
    if not data.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Content cannot be empty")

    message = get_message_by_id(message_id, db)

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    if message.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own messages")

    message = update_message(message, data, db)
    return message_to_response(message)


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute;200/hour")
async def delete_message_route(
    request: Request,
    message_id: int,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    """Delete a message (only by the author or admin)"""
    message = get_message_by_id(message_id, db)

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    if message.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own messages")

    delete_message(message, db)
    return None


@router.post("/{message_id}/like", response_model=MessageResponse)
@limiter.limit("60/minute;600/hour")
async def toggle_like_route(
    request: Request,
    message_id: int,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    """Toggle like on a message"""
    message = get_message_by_id(message_id, db)

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    user = db.query(User).filter(User.id == current_user.id).first()
    message = toggle_message_like(message, user, db)

    return message_to_response(message)


@router.post("/{message_id}/comments", response_model=MessageResponse)
@limiter.limit("30/minute;300/hour")
async def add_comment_route(
    request: Request,
    message_id: int,
    data: CommentCreate,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    """Add a comment to a message"""
    if not data.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment cannot be empty")

    message = get_message_by_id(message_id, db)

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    message = create_comment(message_id, data, current_user.id, db, current_user.current_semester_id)
    return message_to_response(message)
