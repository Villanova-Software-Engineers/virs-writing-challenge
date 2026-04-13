from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String, unique=True, nullable=False, index=True)  # Firebase UID
    email = Column(String, unique=True, nullable=False, index=True)
    first_name = Column(String, default="")
    last_name = Column(String, default="")
    department = Column(String, default="")
    is_admin = Column(Boolean, default=False)
    current_semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    messages = relationship("Message", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    streak = relationship("Streak", back_populates="user", uselist=False, cascade="all, delete-orphan")
    writing_sessions = relationship("WritingSession", back_populates="user", cascade="all, delete-orphan")
    session_state = relationship("SessionState", back_populates="user", uselist=False, cascade="all, delete-orphan")
    current_semester = relationship("Semester", foreign_keys=[current_semester_id])

    @property
    def display_name(self) -> str:
        if self.first_name or self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        return self.email.split("@")[0] if self.email else "Anonymous"

    def __repr__(self):
        return f"<User(id={self.id}, uid='{self.uid}', email='{self.email}')>"
