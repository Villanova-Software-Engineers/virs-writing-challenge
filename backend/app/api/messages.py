from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from firebase_admin import firestore
from app.auth import get_current_user
from app.core import limiter

router = APIRouter(prefix="/messages", tags=["Messages"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    content: str
    category: str = "win"  # "win" | "gain"


class MessageResponse(BaseModel):
    id: str
    content: str
    category: str
    author_name: str
    author_uid: str
    created_at: str


# ── Helpers ──────────────────────────────────────────────────────────────────

def _db():
    return firestore.client()


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("", response_model=list[MessageResponse])
@limiter.limit("100/minute;1000/hour")
async def get_messages(
    request: Request,
    limit: int = 50,
    current_user=Depends(get_current_user),
):
    db = _db()
    docs = (
        db.collection("messages")
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    results = []
    for doc in docs:
        data = doc.to_dict()
        ts = data.get("created_at")
        created_str = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
        results.append(
            MessageResponse(
                id=doc.id,
                content=data["content"],
                category=data.get("category", "win"),
                author_name=data.get("author_name", "Unknown"),
                author_uid=data.get("author_uid", ""),
                created_at=created_str,
            )
        )
    return results


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute;200/hour")
async def create_message(
    request: Request,
    data: MessageCreate,
    current_user=Depends(get_current_user),
):
    if not data.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    if data.category not in ("win", "gain"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category must be 'win' or 'gain'")

    db = _db()
    author_name = getattr(current_user, "display_name", None) or current_user.email or "Anonymous"
    now = datetime.now(timezone.utc)

    doc_ref = db.collection("messages").document()
    doc_ref.set(
        {
            "content": data.content.strip(),
            "category": data.category,
            "author_name": author_name,
            "author_uid": current_user.uid,
            "created_at": now,
        }
    )

    return MessageResponse(
        id=doc_ref.id,
        content=data.content.strip(),
        category=data.category,
        author_name=author_name,
        author_uid=current_user.uid,
        created_at=now.isoformat(),
    )