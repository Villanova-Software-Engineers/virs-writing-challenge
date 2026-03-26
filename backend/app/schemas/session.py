from pydantic import BaseModel
from typing import List, Optional


class WritingSessionCreate(BaseModel):
    duration: int  # in seconds
    started_at: str  # ISO datetime string
    ended_at: str  # ISO datetime string
    description: Optional[str] = None  # Session description


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
    total_time: int  # Total time in seconds
