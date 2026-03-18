from sqlalchemy.orm import Session
from ..models import Semester
from ..schemas import SemesterCreate
from datetime import datetime
from ..utils import generate_access_code

def create_semester(data: SemesterCreate, db: Session):
    access_code = generate_access_code()
    
    while db.query(Semester).filter(Semester.access_code == access_code).first():
        access_code = generate_access_code()
    
    semester_data = data.model_dump()
    semester_data['access_code'] = access_code
    semester_data['is_active'] = True
    
    db_semester = Semester(**semester_data)
    db.add(db_semester)
    db.commit()
    db.refresh(db_semester)
    return db_semester


def get_active_semester(db: Session):
    return db.query(Semester).filter(Semester.is_active == True).first()


def get_semester(id: int, db: Session):
    return db.query(Semester).filter(Semester.id == id).first()


def end_semester(id: int, db: Session):
    db_semester = get_semester(id, db)
    if not db_semester:
        return None
    
    db_semester.is_active = False
    db_semester.ended_at = datetime.utcnow()
        
    db.commit()
    db.refresh(db_semester)
    return db_semester


def get_semesters(skip: int, limit: int, db: Session):
    return db.query(Semester).offset(skip).limit(limit).all()

def delete_semester(id: int, db: Session):
    db_semester = get_semester(id, db)
    if not db_semester:
        return None
    
    db.delete(db_semester)
    db.commit()
    return True