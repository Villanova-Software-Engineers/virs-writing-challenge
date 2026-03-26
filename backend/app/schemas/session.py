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
