from sqlalchemy import Column, Integer, ForeignKey, DateTime, Date, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core import Base


class Streak(Base):
    __tablename__ = "streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    count = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    last_date = Column(Date, nullable=True)  # Last date user wrote
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="streak")

    def __repr__(self):
        return f"<Streak(user_id={self.user_id}, count={self.count}, last_date={self.last_date})>"


class WritingSession(Base):
    __tablename__ = "writing_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="SET NULL"), nullable=True, index=True)
    duration = Column(Integer, nullable=False)  # Duration in seconds
    description = Column(String(255), nullable=True)  # Session description (max 10 words)
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="writing_sessions")

    def __repr__(self):
        return f"<WritingSession(id={self.id}, user_id={self.user_id}, duration={self.duration})>"
