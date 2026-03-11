from sqlalchemy.orm.session import Session
from ..models import User
from ..schemas import UserCreate
from firebase_admin import auth


def create_user(user: dict, db: Session):
    db_user = User(**user)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_users(skip: int, limit: int, db: Session):
    return db.query(User).offset(skip).limit(limit).all()


def get_user(id: int, db: Session):
    return db.get(User, id)


def get_user_by_firebase_id(firebase_id: str, db: Session):
    return db.query(User).filter(User.firebase_id == firebase_id).first()


def update_user(id: int, user_data: dict, db: Session):
    db_user = get_user(id, db)
    if not db_user:
        return None

    for field, val in user_data.items():
        if hasattr(db_user, field):
            setattr(db_user, field, val)

    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(id: int, firebase_id: str, db: Session):
    try:
        auth.delete_user(firebase_id)
    except Exception:
        pass

    db_user = get_user(id, db)
    if not db_user:
        return False

    db.delete(db_user)
    db.commit()
    return True