from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    author = Column(String, nullable=False)
    reply_to_id = Column(Integer, ForeignKey('messages.id'))
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    reply_to = relationship('Message', remote_side=[id])
    replies = relationship('Message', back_populates='reply_to')