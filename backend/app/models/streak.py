from sqlalchemy import Column, Integer, ForeignKey, DateTime, Date, String, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core import Base


class Streak(Base):
    __tablename__ = "streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="SET NULL"), nullable=True, index=True)
    count = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    last_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="streak")
    semester = relationship("Semester")

    def __repr__(self):
        return f"<Streak(user_id={self.user_id}, count={self.count}, last_date={self.last_date})>"


class WritingSession(Base):
    __tablename__ = "writing_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="SET NULL"), nullable=True, index=True)
    duration = Column(Integer, nullable=False)
    description = Column(String(255), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="writing_sessions")

    def __repr__(self):
        return f"<WritingSession(id={self.id}, user_id={self.user_id}, duration={self.duration})>"


class SessionState(Base):
    __tablename__ = "session_states"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    accumulated_seconds = Column(Integer, default=0, nullable=False)
    description = Column(String(255), nullable=True)
    is_running = Column(Boolean, default=False, nullable=False)
    session_start_time = Column(DateTime(timezone=True), nullable=True)
    last_pause_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User", back_populates="session_state")

    def __repr__(self):
        return f"<SessionState(user_id={self.user_id}, accumulated_seconds={self.accumulated_seconds}, is_running={self.is_running})>"
