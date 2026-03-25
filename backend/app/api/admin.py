from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from app.auth import require_admin, CurrentUser
from app.core import limiter
from app.core.database import get_db
from app.models import User

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
