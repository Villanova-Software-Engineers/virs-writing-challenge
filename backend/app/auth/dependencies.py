"""
Authentication dependencies - placeholder implementations.
Replace with Firebase token verification logic.
"""

from fastapi import Depends, HTTPException, status, Request
from .schemas import User, UserRole
from datetime import datetime


async def get_current_user(request: Request) -> User:
    """
    Placeholder dependency for getting current authenticated user.
    TODO: Replace with Firebase token verification from Authorization header.
    """
    # Placeholder mock user - replace with real Firebase auth
    return User(
        id=1,
        first_name="Test",
        last_name="User",
        email="test@villanova.edu",
        department="Writing",
        role=UserRole.USER,
        created_at=datetime.now(),
    )


async def require_admin(request: Request, current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency for admin-only endpoints.
    TODO: Verify user role from Firebase or database.
    """
    # Placeholder - replace with real role check
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user