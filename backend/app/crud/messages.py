from sqlalchemy.orm import Session
from ..models.messages import Message, DeletedMessage
from ..schemas import MessageCreate

def create_message(message: MessageCreate, user_id: int, db: Session) -> Message:
    """Create a new message."""
    db_message = Message(
        user_id=user_id,
        content=message.content,
        reply_to_id=message.reply_to_id,
        semester_id=message.semester_id,
        message_type=message.message_type,
        author="",  # Will be populated from User during response, but stored for audit
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_messages(semester_id: int, skip: int, limit: int, db: Session) -> list[Message]:
    """Get messages for a semester, ordered newest first. Soft-deleted messages have content replaced."""
    messages = (
        db.query(Message)
        .filter(Message.semester_id == semester_id)
        .order_by(Message.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # Replace deleted content in-memory for API response
    for msg in messages:
        if msg.is_deleted:
            msg.content = "Message deleted by admin"
    
    return messages

def get_message(message_id: int, db: Session) -> Message | None:
    """Get a single message by ID. Returns soft-deleted content as replaced."""
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if message and message.is_deleted:
        message.content = "Message deleted by admin"
    
    return message

def get_message_by_semester(message_id: int, semester_id: int, db: Session) -> Message | None:
    """Get a message by ID, ensuring it belongs to a specific semester."""
    message = (
        db.query(Message)
        .filter(Message.id == message_id, Message.semester_id == semester_id)
        .first()
    )
    
    if message and message.is_deleted:
        message.content = "Message deleted by admin"
    
    return message

def update_message(message_id: int, message_data: dict, db: Session) -> Message | None:
    """Update a message. Cannot update if deleted."""
    db_message = db.query(Message).filter(Message.id == message_id).first()
    
    if not db_message or db_message.is_deleted:
        return None
    
    for attr in message_data:
        if hasattr(db_message, attr) and attr != 'id':
            setattr(db_message, attr, message_data[attr])
    
    db.commit()
    db.refresh(db_message)
    return db_message


def soft_delete_message(message_id: int, deleted_by_user_id: int, db: Session) -> bool:
    """Soft delete a message by marking is_deleted=True and creating audit log entry."""
    db_message = db.query(Message).filter(Message.id == message_id).first()
    
    if not db_message:
        return False
    
    # Store original content before marking deleted
    original_content = db_message.content
    original_author = db_message.author
    semester_id = db_message.semester_id
    
    # Mark message as deleted
    db_message.is_deleted = True
    db_message.original_message = original_content
    db.add(db_message)
    db.flush()
    
    # Create audit log entry
    deleted_log = DeletedMessage(
        message_id=message_id,
        deleted_by_user_id=deleted_by_user_id,
        semester_id=semester_id,
        original_content=original_content,
        original_author=original_author,
    )
    db.add(deleted_log)
    db.commit()
    db.refresh(db_message)
    
    return True


def get_deleted_messages(semester_id: int, skip: int = 0, limit: int = 100, db: Session = None) -> list[DeletedMessage]:
    """Get all deleted messages for a semester (admin audit log)."""
    return (
        db.query(DeletedMessage)
        .filter(DeletedMessage.semester_id == semester_id)
        .order_by(DeletedMessage.deleted_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_deleted_messages_by_user(user_id: int, semester_id: int, skip: int = 0, limit: int = 100, db: Session = None) -> list[DeletedMessage]:
    """Get all messages deleted by a specific admin user in a semester."""
    return (
        db.query(DeletedMessage)
        .filter(DeletedMessage.deleted_by_user_id == user_id, DeletedMessage.semester_id == semester_id)
        .order_by(DeletedMessage.deleted_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
