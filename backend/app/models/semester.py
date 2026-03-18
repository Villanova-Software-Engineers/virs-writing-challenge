from sqlalchemy import Column, String, Integer, Boolean, DateTime, CheckConstraint
from sqlalchemy.sql import func
from ..core import Base

class Semester(Base):
    __tablename__ = "semesters"
    
    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String, nullable=False)
    access_code = Column(String, unique=True, nullable=False, index=True)
    
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True) 
    
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    auto_clear = Column(Boolean, default=False, nullable=False)
    
    __table_args__ = (
        CheckConstraint('end_date > start_date', name='check_end_after_start'),
    )
    
    def __repr__(self):
        return f"<Semester(id={self.id}, name='{self.name}', is_active={self.is_active})>"