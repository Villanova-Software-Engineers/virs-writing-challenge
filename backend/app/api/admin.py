from app.api.deps import (
    APIRouter, Depends, HTTPException, Request, status,
    Session, Optional, limiter, get_db,
    CurrentUser, require_admin,
)
from app.schemas.admin import (
    UserListItem,
    UserListResponse,
    SetAdminRequest,
    UpdateUserRequest,
    AdminSessionsListResponse,
    MessageUpdateRequest,
    PinMessageRequest,
    AdminSessionCreate,
    AdminSessionUpdate,
)
from app.schemas.session import WritingSessionResponse
from app.schemas.message import MessageListResponse
from app.schemas.leaderboard import LeaderboardResponse
from app.crud.admin import (
    get_all_users,
    get_user_by_id,
    set_user_admin_status,
    update_user_info,
    delete_user_by_id,
    get_all_sessions,
    session_to_admin_response,
    admin_update_message_content,
    admin_delete_message,
    admin_pin_message,
    admin_delete_comment,
    get_message_by_id,
    get_comment_by_id,
    user_to_list_item,
    get_session_by_id,
    admin_create_session,
    admin_update_session,
    admin_delete_session,
)
from app.crud.session import session_to_response
from app.crud.message import get_messages_paginated, message_to_response
from app.crud.leaderboard import get_leaderboard

router = APIRouter(prefix="/admin", tags=["Admin"])


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
    users, total = get_all_users(db, limit, offset)

    return UserListResponse(
        users=[user_to_list_item(u) for u in users],
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
    user = get_user_by_id(user_id, db)

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

    user = set_user_admin_status(user, data.is_admin, db)
    return user_to_list_item(user)


@router.get("/users/{user_id}", response_model=UserListItem)
@limiter.limit("60/minute;600/hour")
async def get_user(
    request: Request,
    user_id: int,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = get_user_by_id(user_id, db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user_to_list_item(user)


@router.patch("/users/{user_id}", response_model=UserListItem)
@limiter.limit("20/minute;200/hour")
async def update_user(
    request: Request,
    user_id: int,
    data: UpdateUserRequest,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = get_user_by_id(user_id, db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user = update_user_info(user, data, db)
    return user_to_list_item(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute;100/hour")
async def delete_user(
    request: Request,
    user_id: int,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = get_user_by_id(user_id, db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    delete_user_by_id(user, db)
    return None


@router.get("/sessions", response_model=AdminSessionsListResponse)
@limiter.limit("30/minute;300/hour")
async def list_all_sessions(
    request: Request,
    limit: int = 100,
    semester_id: Optional[int] = None,
    user_id: Optional[int] = None,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    sessions, total_time = get_all_sessions(db, limit, semester_id, user_id)

    return AdminSessionsListResponse(
        sessions=[session_to_admin_response(s) for s in sessions],
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
    if not data.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Content cannot be empty")

    message = get_message_by_id(message_id, db)

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    admin_update_message_content(message, data.content, db)
    return {"message": "Message updated successfully"}


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute;200/hour")
async def admin_delete_message_route(
    request: Request,
    message_id: int,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    message = get_message_by_id(message_id, db)

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    admin_delete_message(message, db)
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
    message = get_message_by_id(message_id, db)

    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    admin_pin_message(message, data.is_pinned, db)
    return {"message": "Message pin status updated successfully"}


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute;200/hour")
async def admin_delete_comment_route(
    request: Request,
    comment_id: int,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    comment = get_comment_by_id(comment_id, db)

    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    admin_delete_comment(comment, db)
    return None


@router.get("/messages/archived", response_model=MessageListResponse)
@limiter.limit("30/minute;300/hour")
async def get_archived_messages(
    request: Request,
    semester_id: int,
    limit: int = 20,
    cursor: Optional[str] = None,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get archived messages from a specific semester (admin only).

    - semester_id: The semester ID to retrieve messages from
    - limit: Number of messages to return (default: 20, max: 100)
    - cursor: Cursor for pagination
    """
    messages, next_cursor, has_more = get_messages_paginated(
        db, limit, cursor, semester_id
    )

    return MessageListResponse(
        messages=[message_to_response(msg) for msg in messages],
        next_cursor=next_cursor,
        has_more=has_more
    )


@router.get("/leaderboard/archived", response_model=LeaderboardResponse)
@limiter.limit("30/minute;300/hour")
async def get_archived_leaderboard(
    request: Request,
    semester_id: int,
    limit: int = 50,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get archived leaderboard from a specific semester (admin only).

    - semester_id: The semester ID to retrieve leaderboard from
    - limit: Number of entries to return (default: 50, max: 100)
    """
    entries, retrieved_semester_id, semester_name = get_leaderboard(
        db, current_user.id, current_user.uid, semester_id, limit
    )

    return LeaderboardResponse(
        entries=entries,
        semester_id=retrieved_semester_id,
        semester_name=semester_name
    )


@router.post("/sessions", response_model=WritingSessionResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute;200/hour")
async def admin_create_session_route(
    request: Request,
    data: AdminSessionCreate,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a writing session for any user (admin only)"""
    if data.duration <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duration must be positive"
        )

    user = get_user_by_id(data.user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    try:
        session, warning_message = admin_create_session(data, db)
        return session_to_response(session, warning_message)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid datetime format"
        )


@router.patch("/sessions/{session_id}", response_model=WritingSessionResponse)
@limiter.limit("20/minute;200/hour")
async def admin_update_session_route(
    request: Request,
    session_id: int,
    data: AdminSessionUpdate,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update a writing session (admin only)"""
    session = get_session_by_id(session_id, db)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    if data.duration is not None and data.duration <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duration must be positive"
        )

    try:
        session = admin_update_session(session, data, db)
        return session_to_response(session)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid datetime format"
        )


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute;200/hour")
async def admin_delete_session_route(
    request: Request,
    session_id: int,
    current_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a writing session (admin only)"""
    session = get_session_by_id(session_id, db)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    admin_delete_session(session, db)
    return None
