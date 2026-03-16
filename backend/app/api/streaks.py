from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from datetime import datetime, timezone, date
from firebase_admin import firestore
from app.auth import get_current_user
from app.core import limiter

router = APIRouter(prefix="/streaks", tags=["Streaks"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class StreakResponse(BaseModel):
    count: int
    last_date: Optional[str] = None  # ISO date string YYYY-MM-DD

    class Config:
        # allow Optional without importing at top
        pass


from typing import Optional  # noqa: E402 – keep near schema for readability


# ── Helpers ──────────────────────────────────────────────────────────────────

def _db():
    return firestore.client()


def _streak_doc(db, uid: str):
    return db.collection("streaks").document(uid)


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/current", response_model=StreakResponse)
@limiter.limit("100/minute;1000/hour")
async def get_current_streak(
    request: Request,
    current_user=Depends(get_current_user),
):
    db = _db()
    doc = _streak_doc(db, current_user.uid).get()
    if not doc.exists:
        return StreakResponse(count=0, last_date=None)

    data = doc.to_dict()
    return StreakResponse(
        count=data.get("count", 0),
        last_date=data.get("last_date"),  # stored as "YYYY-MM-DD"
    )


@router.post("/update", response_model=StreakResponse)
@limiter.limit("30/minute;300/hour")
async def update_streak(
    request: Request,
    current_user=Depends(get_current_user),
):
    """
    Called when a professor stops/submits their writing timer.
    Logic:
      - today == last_date  → no change (already counted today)
      - today == last_date + 1 day → increment streak
      - gap > 1 day         → reset to 1 (they wrote today, streak starts fresh)
      - no previous record  → set count = 1
    """
    db = _db()
    ref = _streak_doc(db, current_user.uid)
    doc = ref.get()
    today_str = date.today().isoformat()  # "YYYY-MM-DD"

    if not doc.exists:
        ref.set({"count": 1, "last_date": today_str})
        return StreakResponse(count=1, last_date=today_str)

    data = doc.to_dict()
    last_date_str = data.get("last_date")
    current_count = data.get("count", 0)

    if last_date_str == today_str:
        # Already written today — return unchanged
        return StreakResponse(count=current_count, last_date=last_date_str)

    new_count = current_count
    if last_date_str:
        last = date.fromisoformat(last_date_str)
        delta = (date.today() - last).days
        if delta == 1:
            new_count = current_count + 1  # consecutive day
        else:
            new_count = 1  # streak broken — restart
    else:
        new_count = 1

    ref.set({"count": new_count, "last_date": today_str})
    return StreakResponse(count=new_count, last_date=today_str)