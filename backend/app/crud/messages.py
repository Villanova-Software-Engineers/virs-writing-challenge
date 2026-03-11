from sqlalchemy.orm import Session
from ..models.messages import Message
from ..schemas.messages import MessageCreate

def create_message(message:MessageCreate, db: Session) -> Message:
    db_message = Message(**message.model_dump())
    db.add(message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_messages(skip: int, limit: int, db: Session) -> [Message]:
    return db.query(Message).offset(skip).limit(limit).all()

def get_message(id: int, db: Session) -> Message | None:
    return db.query(Message).filter(Message.id == id).first()

def update_message(id: int, message_data: dict, db: Session) -> Message | None:
    db_message = get_message(id, db)
    if not db_message:
        return None

    for attr in message_data:
        if hasattr(db_message, attr):
            setattr(db_message, attr, message_data[attr])

    db.commit()
    db.refresh(db_message)
    return db_message

def delete_message(id: int, db: Session) -> bool:
    db_message = get_message(id, db)
    if not db_message:
        return True

    db.delete(db_message)
    db.commit()
    return True