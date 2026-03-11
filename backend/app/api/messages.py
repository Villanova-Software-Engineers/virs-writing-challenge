from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..core import get_db, limiter
from ..crud import messages as messages_crud
from ..schemas import MessageCreate

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.post("")
@limiter.limit("10/minute;100/hour")
async def create_message(request: Request, data: MessageCreate, db: Session = Depends(get_db)):
    try:
        message = messages_crud.create_message(data, db)
        return message
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Message already exists")
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create message")


@router.get("")
@limiter.limit("100/minute;1000/hour")
async def get_messages(request: Request, skip: int, limit: int, db: Session = Depends(get_db)):
    try:
        messages = messages_crud.get_messages(skip, limit, db)
        return messages
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get messages")


@router.get("/{id}")
@limiter.limit("100/minute;1000/hour")
async def get_message(request: Request, id: int, db: Session = Depends(get_db)):
    try:
        message = messages_crud.get_message(id, db)
        if not message:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
        return message
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create property")


# @router.patch("/{id}")
# @limiter.limit("5/minute;50/hour")
# async def update_message(request: Request, id: int, data: MessageUpdate, db: Session = Depends(get_db)):
#     try:
#         message = message_crud.update_message(id, data.model_dump(exclude_unset=True), db)
#         if not property:
#             raise HTTPException(status_code=404, detail="Property not found")
#         return property
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail="Failed to update property")

@router.delete("/{message_id}")
@limiter.limit("5/minute;30/hour")
async def delete_message(request: Request, id: int, db: Session = Depends(get_db)):
    try:
        deleted = messages_crud.delete_message(id, db)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
        return
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete message")