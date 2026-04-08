from sqlalchemy.orm import Session
from typing import Optional, Tuple
from app.models import User
from app.core.firebase_auth import get_firestore_user_data


def parse_name(name: Optional[str]) -> Tuple[str, str]:
    """Parse full name into first and last name"""
    if not name:
        return "", ""
    name_parts = name.strip().split(" ", 1)
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    return first_name, last_name


def get_or_create_user(
    db: Session,
    uid: str,
    email: Optional[str],
    name: Optional[str] = None,
    is_admin_claim: bool = False,
) -> User:
    """Get existing user or create new user with Firebase sync"""
    user = db.query(User).filter(User.uid == uid).first()
    first_name, last_name = parse_name(name)

    if user:
        updated = False

        if email and user.email != email:
            user.email = email
            updated = True

        if (first_name or last_name) and not user.first_name and not user.last_name:
            user.first_name = first_name
            user.last_name = last_name
            updated = True

        if is_admin_claim and not user.is_admin:
            user.is_admin = True
            updated = True

        if not user.department or user.department.strip() == "" or user.department == "Not set":
            department, fs_first, fs_last = get_firestore_user_data(uid)
            if department:
                user.department = department
                updated = True
                print(f"[UserCRUD] Backfilled department for {uid}: {department}")

        if updated:
            db.commit()
            db.refresh(user)

        return user

    department, fs_first, fs_last = get_firestore_user_data(uid)
    if not first_name and not last_name:
        first_name = fs_first
        last_name = fs_last

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
