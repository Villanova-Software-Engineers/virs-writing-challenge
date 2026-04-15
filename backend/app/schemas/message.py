from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class MessageCreate(BaseModel):
    content: str


class MessageUpdate(BaseModel):
    content: str


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: str
    author_uid: str
    author_name: str
    author_is_admin: bool
    content: str
    created_at: str


class MessageResponse(BaseModel):
    id: str
    content: str
    author_name: str
    author_is_admin: bool
    author_uid: str
    created_at: str
    is_pinned: bool = False
    pinned_at: Optional[str] = None
    likes: List[str] = []
    comments: List[CommentResponse] = []


class MessageListResponse(BaseModel):
    messages: List[MessageResponse]
    next_cursor: Optional[str] = None
    has_more: bool = False
