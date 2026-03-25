from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Table, Enum, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core import Base
import enum


class MessageCategory(str, enum.Enum):
    WIN = "win"
    GAIN = "gain"


# Association tables for likes and dislikes (many-to-many)
message_likes = Table(
    "message_likes",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("message_id", Integer, ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True),
)

message_dislikes = Table(
    "message_dislikes",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("message_id", Integer, ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True),
)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    category = Column(Enum(MessageCategory), default=MessageCategory.WIN, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_pinned = Column(Boolean, default=False, nullable=False, index=True)
    pinned_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    author = relationship("User", back_populates="messages")
    comments = relationship("Comment", back_populates="message", cascade="all, delete-orphan", order_by="Comment.created_at")
    liked_by = relationship("User", secondary=message_likes, backref="liked_messages")
    disliked_by = relationship("User", secondary=message_dislikes, backref="disliked_messages")

    def __repr__(self):
        return f"<Message(id={self.id}, category='{self.category}', author_id={self.author_id})>"


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    message = relationship("Message", back_populates="comments")
    author = relationship("User", back_populates="comments")

    def __repr__(self):
        return f"<Comment(id={self.id}, message_id={self.message_id}, author_id={self.author_id})>"
