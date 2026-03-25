from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as firebase_auth, firestore
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.models import User


security = HTTPBearer()


class CurrentUser(BaseModel):
    """Represents the authenticated user from Firebase token"""
    id: int  # Database ID
    uid: str  # Firebase UID
    email: Optional[str] = None
    display_name: Optional[str] = None
    is_admin: bool = False

    class Config:
        from_attributes = True


def get_or_create_user(
    db: Session,
    uid: str,
    email: Optional[str],
    name: Optional[str] = None,
    is_admin_claim: bool = False,
) -> User:
    """Get existing user or create/update from Firebase auth data"""
    user = db.query(User).filter(User.uid == uid).first()

    # Parse name into first/last
    first_name = ""
    last_name = ""
    if name:
        name_parts = name.strip().split(" ", 1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

    if user:
        # Update user info if changed (sync from Firebase)
        updated = False
        if email and user.email != email:
            user.email = email
            updated = True
        # Only update name if user hasn't set their own and Firebase has one
        if name and not user.first_name and not user.last_name:
            user.first_name = first_name
            user.last_name = last_name
            updated = True
        # Sync admin status from Firebase custom claims
        if is_admin_claim and not user.is_admin:
            user.is_admin = True
            updated = True

        # Backfill department from Firestore if empty or "Not set"
        if not user.department or user.department.strip() == "" or user.department == "Not set":
            try:
                firestore_db = firestore.client()
                user_doc = firestore_db.collection('users').document(uid).get()
                if user_doc.exists:
                    user_data = user_doc.to_dict()
                    department = user_data.get('department', '')
                    # Only update if department is valid (not empty and not "Not set")
                    if department and department.strip() and department != "Not set":
                        user.department = department
                        updated = True
                        print(f"[Auth] Backfilled department for existing user {uid}: {department}")
            except Exception as e:
                print(f"[Auth] Failed to backfill department from Firestore for {uid}: {e}")

        if updated:
            db.commit()
            db.refresh(user)
        return user

    # Create new user with Firebase data
    # Try to fetch department from Firestore
    department = ""
    try:
        firestore_db = firestore.client()
        user_doc = firestore_db.collection('users').document(uid).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            dept = user_data.get('department', '')
            # Only use department if it's valid (not empty and not "Not set")
            if dept and dept.strip() and dept != "Not set":
                department = dept
            # Also use Firestore names if available and Firebase name is not set
            if not first_name and not last_name:
                first_name = user_data.get('firstName', '')
                last_name = user_data.get('lastName', '')
    except Exception as e:
        # If Firestore fetch fails, log but continue with empty department
        print(f"[Auth] Failed to fetch Firestore profile for {uid}: {e}")

    user = User(
        uid=uid,
        email=email or "",
        first_name=first_name,
        last_name=last_name,
        department=department,
        is_admin=is_admin_claim,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> CurrentUser:
    token = credentials.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
        uid = decoded.get("uid", "")
        email = decoded.get("email")
        name = decoded.get("name")  # Display name from Firebase
        is_admin_claim = decoded.get("admin", False)

        # Get or create user in PostgreSQL, syncing Firebase data
        user = get_or_create_user(
            db, uid, email,
            name=name,
            is_admin_claim=is_admin_claim,
        )

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
    token = credentials.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
        uid = decoded.get("uid", "")
        email = decoded.get("email")
        name = decoded.get("name")
        is_admin_claim = decoded.get("admin", False)

        # Get or create user in PostgreSQL
        user = get_or_create_user(
            db, uid, email,
            name=name,
            is_admin_claim=is_admin_claim,
        )

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
