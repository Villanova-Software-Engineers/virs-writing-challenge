from pydantic import BaseModel
from typing import Optional


class StreakResponse(BaseModel):
    count: int
    last_date: Optional[str] = None  # ISO date string YYYY-MM-DD
