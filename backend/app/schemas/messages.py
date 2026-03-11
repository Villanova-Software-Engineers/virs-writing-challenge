from pydantic import BaseModel, ConfigDict
from typing import Any, Dict, List, Optional
from datetime import datetime


class MessageBase(BaseModel):
    author: str
    content: str
    reply_to_id: Optional[int] = None


class MessageCreate(MessageBase):
    timestamp: str


class MessageUpdate(BaseModel):
    content: Optional[str] = None


class MessageResponse(MessageBase):
    id: int
    updated_at: Optional[datetime]


    model_config = ConfigDict(from_attributes=True)