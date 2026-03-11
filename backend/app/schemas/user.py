from pydantic import BaseModel
from datetime import datetime

class UserBase(BaseModel):
    first_name: str
    last_name: str
    department: str
    is_admin: bool

class UserRead(UserBase):
    id: int
    firebase_uid: str
    created_at: datetime

class UserCreate(UserBase):
    firebase_uid: str   

class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    department: str | None = None
    is_admin: bool | None = None