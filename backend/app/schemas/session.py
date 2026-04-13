from pydantic import BaseModel
from typing import List, Optional


class WritingSessionCreate(BaseModel):
    duration: int
    started_at: str
    ended_at: str
    description: Optional[str] = None


class WritingSessionResponse(BaseModel):
    id: int
    duration: int
    description: Optional[str] = None
    started_at: str
    ended_at: str
    semester_id: Optional[int] = None
    created_at: str


class WritingSessionsListResponse(BaseModel):
    sessions: List[WritingSessionResponse]
    total_time: int


class SessionStateResponse(BaseModel):
    id: int
    user_id: int
    accumulated_seconds: int
    description: Optional[str] = None
    is_running: bool
    session_start_time: Optional[str] = None
    last_pause_time: Optional[str] = None
    created_at: str
    updated_at: str


class SessionStateUpdate(BaseModel):
    accumulated_seconds: Optional[int] = None
    description: Optional[str] = None
    is_running: Optional[bool] = None
    session_start_time: Optional[str] = None
    last_pause_time: Optional[str] = None 
