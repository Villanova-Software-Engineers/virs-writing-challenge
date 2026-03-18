from enum import Enum

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core import Base

class MessageType(str, Enum):
    """Message type enumeration."""
    USER = "user"
    ADMIN = "admin"

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    semester_id = Column(Integer, ForeignKey('semesters.id'), nullable=False)
    
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    author = Column(String, nullable=False)
    reply_to_id = Column(Integer, ForeignKey('messages.id'))
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    message_type = Column(SQLEnum(MessageType), default=MessageType.USER, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    original_message = Column(Text, nullable=True)

    user = relationship('User', foreign_keys=[user_id])
    semester = relationship('Semester', foreign_keys=[semester_id])
    reply_to = relationship('Message', remote_side=[id])
    replies = relationship('Message', back_populates='reply_to')


class DeletedMessage(Base):
    """Audit log for deleted messages."""
    __tablename__ = "deleted_messages"
    
    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey('messages.id'), nullable=False, index=True)
    deleted_by_user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    deleted_at = Column(DateTime(timezone=True), server_default=func.now())
    semester_id = Column(Integer, ForeignKey('semesters.id'), nullable=False, index=True)
    original_content = Column(Text, nullable=False)
    original_author = Column(String, nullable=False)
    
    message = relationship('Message', foreign_keys=[message_id])
    deleted_by_user = relationship('User', foreign_keys=[deleted_by_user_id])
    semester = relationship('Semester', foreign_keys=[semester_id])
