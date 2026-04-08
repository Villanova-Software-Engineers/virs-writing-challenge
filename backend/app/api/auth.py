from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.firebase_auth import verify_firebase_token
from app.crud.user import get_or_create_user
from app.schemas.auth import CurrentUser


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> CurrentUser:
    """Get current authenticated user"""
    try:
        uid, email, name, is_admin_claim = verify_firebase_token(credentials.credentials)
        user = get_or_create_user(db, uid, email, name, is_admin_claim)

        return CurrentUser(
            id=user.id,
            uid=uid,
            email=user.email,
            display_name=user.display_name,
            is_admin=user.is_admin or is_admin_claim,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> CurrentUser:
    """Require admin authentication"""
    try:
        uid, email, name, is_admin_claim = verify_firebase_token(credentials.credentials)
        user = get_or_create_user(db, uid, email, name, is_admin_claim)

        is_admin = user.is_admin or is_admin_claim
        if not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )

        return CurrentUser(
            id=user.id,
            uid=uid,
            email=user.email,
            display_name=user.display_name,
            is_admin=True,
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


async def require_semester_registration(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CurrentUser:
    """Require user to be registered for a semester (admins are exempt)"""
    # Admins don't need to be registered for a semester
    if current_user.is_admin:
        return current_user

    # Check if user has a current_semester_id
    from app.models import User
    user = db.query(User).filter(User.id == current_user.id).first()

    if not user or not user.current_semester_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must join a semester before accessing this resource"
        )

    return current_user
