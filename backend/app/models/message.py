from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Table, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core import Base


message_likes = Table(
    "message_likes",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("message_id", Integer, ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True),
)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="SET NULL"), nullable=True, index=True)
    is_pinned = Column(Boolean, default=False, nullable=False, index=True)
    pinned_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    author = relationship("User", back_populates="messages")
    semester = relationship("Semester")
    comments = relationship("Comment", back_populates="message", cascade="all, delete-orphan", order_by="Comment.created_at")
    liked_by = relationship("User", secondary=message_likes, backref="liked_messages")

    def __repr__(self):
        return f"<Message(id={self.id}, author_id={self.author_id})>"


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    message = relationship("Message", back_populates="comments")
    author = relationship("User", back_populates="comments")
    semester = relationship("Semester")

    def __repr__(self):
        return f"<Comment(id={self.id}, message_id={self.message_id}, author_id={self.author_id})>"
