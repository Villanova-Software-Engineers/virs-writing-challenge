from pydantic import BaseModel
from typing import Optional


class CurrentUser(BaseModel):
    """Authenticated user from Firebase token"""
    id: int
    uid: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    is_admin: bool = False

    class Config:
        from_attributes = True
