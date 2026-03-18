"""
Pydantic schemas for auth module.
"""

from pydantic import BaseModel
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    USER = "user"


class User(BaseModel):
    """User response schema - placeholder."""
    id: int
    first_name: str
    last_name: str
    email: str
    department: str | None = None
    role: UserRole = UserRole.USER
    created_at: datetime | None = None
    updated_at: datetime | None = None
