from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Optional
from datetime import date
from sqlalchemy.orm import Session
from app.auth import get_current_user, CurrentUser
from app.core import limiter
from app.core.database import get_db
from app.models import Streak

router = APIRouter(prefix="/streaks", tags=["Streaks"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class StreakResponse(BaseModel):
    count: int
    last_date: Optional[str] = None  # ISO date string YYYY-MM-DD


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/current", response_model=StreakResponse)
@limiter.limit("100/minute;1000/hour")
async def get_current_streak(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    streak = db.query(Streak).filter(Streak.user_id == current_user.id).first()

    if not streak:
        return StreakResponse(count=0, last_date=None)

    return StreakResponse(
        count=streak.count,
        last_date=streak.last_date.isoformat() if streak.last_date else None,
    )


@router.post("/update", response_model=StreakResponse)
@limiter.limit("30/minute;300/hour")
async def update_streak(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Called when a professor stops/submits their writing timer.
    Logic:
      - today == last_date  → no change (already counted today)
      - today == last_date + 1 day → increment streak
      - gap > 1 day         → reset to 1 (they wrote today, streak starts fresh)
      - no previous record  → set count = 1
    """
    today = date.today()
    streak = db.query(Streak).filter(Streak.user_id == current_user.id).first()

    if not streak:
        # Create new streak record
        streak = Streak(
            user_id=current_user.id,
            count=1,
            longest_streak=1,
            last_date=today,
        )
        db.add(streak)
        db.commit()
        db.refresh(streak)
        return StreakResponse(count=1, last_date=today.isoformat())

    # Check if already written today
    if streak.last_date == today:
        return StreakResponse(
            count=streak.count,
            last_date=streak.last_date.isoformat(),
        )

    # Calculate new streak count
    new_count = streak.count
    if streak.last_date:
        delta = (today - streak.last_date).days
        if delta == 1:
            new_count = streak.count + 1  # consecutive day
        else:
            new_count = 1  # streak broken — restart
    else:
        new_count = 1

    # Update streak
    streak.count = new_count
    streak.last_date = today
    if new_count > streak.longest_streak:
        streak.longest_streak = new_count

    db.commit()
    db.refresh(streak)

    return StreakResponse(count=streak.count, last_date=today.isoformat())
