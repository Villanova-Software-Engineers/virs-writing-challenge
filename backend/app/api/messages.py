from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from ..core import get_db, limiter
from ..crud import messages as messages_crud
from ..schemas import MessageCreate, MessageUpdate, MessageResponse, DeletedMessageResponse
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/messages", tags=["Messages"])

@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute;100/hour")
async def create_message_handler(
    request: Request,
    data: MessageCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        message = messages_crud.create_message(data, current_user.id, db)
        message.author = f"{current_user.first_name} {current_user.last_name}".strip()
        return message
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid message data")
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create message")


@router.get("", response_model=List[MessageResponse])
@limiter.limit("100/minute;1000/hour")
async def get_messages_handler(
    request: Request,
    semester_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    try:
        messages = messages_crud.get_messages(semester_id, skip, limit, db)
        return messages
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve board")


@router.get("/{id}", response_model=MessageResponse)
@limiter.limit("100/minute;1000/hour")
async def get_message_handler(request: Request, id: int, db: Session = Depends(get_db)):
    try:
        message = messages_crud.get_message(id, db)
        if not message:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
        return message
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve message")


@router.patch("/{id}", response_model=MessageResponse)
@limiter.limit("5/minute;50/hour")
async def update_message_handler(
    request: Request,
    id: int,
    data: MessageUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        message = messages_crud.get_message(id, db)
        if not message:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
        
        if message.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own messages")
        
        message = messages_crud.update_message(id, data.model_dump(exclude_unset=True), db)
        if not message:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
        return message
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update message")


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute;30/hour")
async def delete_message_handler(
    request: Request,
    id: int,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        message = messages_crud.get_message(id, db)
        if not message:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

        messages_crud.soft_delete_message(id, current_user.id, db)
        return
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete message")


@router.get("/deleted/all", response_model=List[DeletedMessageResponse])
@limiter.limit("50/minute;500/hour")
async def get_deleted_messages_handler(
    request: Request,
    semester_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all deleted messages for a semester (admin audit log)."""
    try:
        deleted = messages_crud.get_deleted_messages(semester_id, skip, limit, db)
        return deleted
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve deleted messages")


@router.get("/deleted/{user_id}", response_model=List[DeletedMessageResponse])
@limiter.limit("50/minute;500/hour")
async def get_deleted_messages_by_user_handler(
    request: Request,
    user_id: int,
    semester_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all messages deleted by a specific admin user in a semester."""
    try:
        deleted = messages_crud.get_deleted_messages_by_user(user_id, semester_id, skip, limit, db)
        return deleted
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve deleted messages")
