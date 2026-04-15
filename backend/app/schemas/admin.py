from pydantic import BaseModel
from typing import List, Optional


class UserListItem(BaseModel):
    id: int
    uid: str
    email: str
    first_name: str
    last_name: str
    is_admin: bool
    created_at: Optional[str] = None


class UserListResponse(BaseModel):
    users: List[UserListItem]
    total: int


class SetAdminRequest(BaseModel):
    is_admin: bool


class UpdateUserRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class AdminWritingSessionResponse(BaseModel):
    id: int
    user_uid: str
    user_name: str
    duration: int
    description: Optional[str] = None
    started_at: str
    ended_at: str
    semester_id: Optional[int] = None
    created_at: str


class AdminSessionsListResponse(BaseModel):
    sessions: List[AdminWritingSessionResponse]
    total_time: int


class MessageUpdateRequest(BaseModel):
    content: str


class PinMessageRequest(BaseModel):
    is_pinned: bool


class AdminSessionCreate(BaseModel):
    user_id: int
    duration: int
    started_at: str
    ended_at: str
    description: Optional[str] = None


class AdminSessionUpdate(BaseModel):
    duration: Optional[int] = None
    description: Optional[str] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
