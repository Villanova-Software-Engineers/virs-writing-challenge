from pydantic import BaseModel
from typing import List, Optional


class LeaderboardEntry(BaseModel):
    rank: int
    user_uid: str
    user_name: str
    total_time: int 
    streak: int
    active_days: int
    is_current_user: bool


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    semester_id: Optional[int] = None
    semester_name: Optional[str] = None
