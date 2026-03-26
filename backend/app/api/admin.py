from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import Optional
from app.auth import require_admin, CurrentUser
from app.core import limiter
from app.core.database import get_db
from app.schemas.admin import (
    UserListItem,
    UserListResponse,
    SetAdminRequest,
    UpdateUserRequest,
    AdminSessionsListResponse,
    MessageUpdateRequest,
    PinMessageRequest,
)
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
)

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
