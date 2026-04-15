from pydantic import BaseModel
from typing import List, Optional


class SemesterInfo(BaseModel):
    id: int
    name: str
    access_code: str
    is_active: bool


class UserProfileResponse(BaseModel):
    uid: str
    email: Optional[str] = None
    first_name: str
    last_name: str
    is_admin: bool = False
    current_semester: Optional[SemesterInfo] = None
    created_at: Optional[str] = None


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserStats(BaseModel):
    total_time: int  # in seconds
    current_streak: int
    longest_streak: int
    active_days: int
    semester_id: Optional[int] = None
    semester_name: Optional[str] = None


class SemesterStats(BaseModel):
    semester_id: int
    semester_name: str
    total_time: int
    longest_streak: int
    active_days: int


class UserStatsHistory(BaseModel):
    semesters: List[SemesterStats]
