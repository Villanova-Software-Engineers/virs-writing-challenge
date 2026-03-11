from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List


from ..core import get_db, limiter
from ..crud import user as user_crud
from ..schemas import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=UserResponse)
@limiter.limit("10/minute;100/hour")
async def create_user_handler(
    request: Request,
    data: UserCreate,
    db: Session = Depends(get_db),
):
    try:
        user = user_crud.create_user(data.model_dump(), db)
        return user
    except IntegrityError:
        db.rollback()
        existing = user_crud.get_user_by_firebase_id(data.firebase_id, db)
        if existing:
            return existing
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )


@router.get("", response_model=List[UserResponse])
@limiter.limit("100/minute;1000/hour")
async def get_users_handler(
    request: Request,
    skip: int = 0,
    limit: int = 0,
    db: Session = Depends(get_db),
):
    try:
        users = user_crud.get_users(skip, limit, db)
        return users
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users",
        )


@router.get("/{id}", response_model=UserResponse)
@limiter.limit("100/minute;1000/hour")
async def get_user_handler(
    request: Request,
    id: int,
    db: Session = Depends(get_db),
):
    try:
        user = user_crud.get_user(id, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user",
        )


@router.get("/firebase/{firebase_id}", response_model=UserResponse)
@limiter.limit("100/minute;1000/hour")
async def get_user_by_firebase_id_handler(
    request: Request,
    firebase_id: str,
    db: Session = Depends(get_db),
):
    try:
        user = user_crud.get_user_by_firebase_id(firebase_id, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user",
        )


@router.patch("/{id}", response_model=UserResponse)
@limiter.limit("5/minute;50/hour")
async def update_user_handler(
    request: Request,
    id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
):
    try:
        user = user_crud.update_user(id, data.model_dump(exclude_unset=True), db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user",
        )


@router.delete("/{id}", status_code=204)
@limiter.limit("5/minute;30/hour")
async def delete_user_handler(
    request: Request,
    id: int,
    firebase_id: str,
    db: Session = Depends(get_db),
):
    try:
        deleted = user_crud.delete_user(id, firebase_id, db)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user",
        )