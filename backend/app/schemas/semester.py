from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional


class SemesterBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Semester name (e.g., 'Fall 2024')")
    start_date: datetime = Field(..., description="Semester start date and time (EST)")
    end_date: datetime = Field(..., description="Semester end date and time (EST)")
    auto_clear: bool = Field(default=False, description="Whether to clear data at semester end")


class SemesterCreate(SemesterBase):
    pass


class SemesterUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    access_code: Optional[str] = Field(None, min_length=1, max_length=20)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    auto_clear: Optional[bool] = None


class SemesterResponse(SemesterBase):
    id: int
    access_code: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class SemesterJoin(BaseModel):
    access_code: str = Field(..., min_length=1, max_length=20, description="Semester registration code")