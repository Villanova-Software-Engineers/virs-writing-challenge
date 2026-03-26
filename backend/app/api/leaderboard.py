from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import Optional
from app.auth import get_current_user, CurrentUser
from app.core import limiter
from app.core.database import get_db
from app.schemas.leaderboard import LeaderboardResponse
from app.crud.leaderboard import get_leaderboard

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("", response_model=LeaderboardResponse)
@limiter.limit("60/minute;600/hour")
async def get_leaderboard_route(
    request: Request,
    semester_id: Optional[int] = None,
    limit: int = 50,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    
    entries, semester_id_result, semester_name = get_leaderboard(
        db,
        current_user.id,
        current_user.uid,
        semester_id,
        limit
    )

    return LeaderboardResponse(
        entries=entries,
        semester_id=semester_id_result,
        semester_name=semester_name,
    )
