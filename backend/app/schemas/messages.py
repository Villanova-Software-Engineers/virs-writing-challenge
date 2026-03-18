from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

class MessageType(str, Enum):
    """Message type enumeration."""
    USER = "user"
    ADMIN = "admin"


class MessageBase(BaseModel):
    content: str
    reply_to_id: Optional[int] = None


class MessageCreate(MessageBase):
    semester_id: int
    message_type: MessageType = MessageType.USER


class MessageUpdate(BaseModel):
    content: Optional[str] = None


class MessageResponse(MessageBase):
    id: int
    user_id: int
    author: str
    semester_id: int
    message_type: MessageType
    created_at: datetime
    is_deleted: bool
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class DeletedMessageResponse(BaseModel):
    """Response for deleted message audit log."""
    id: int
    message_id: int
    deleted_by_user_id: int
    deleted_at: datetime
    semester_id: int
    original_content: str
    original_author: str
    
    model_config = ConfigDict(from_attributes=True)