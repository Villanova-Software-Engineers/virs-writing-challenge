from app.api.deps import (
    APIRouter, Depends, Request, Session,
    limiter, get_db, CurrentUser, require_semester_registration,
)
from app.schemas.streak import StreakResponse
from app.crud.streak import get_user_streak, update_user_streak, streak_to_response

router = APIRouter(prefix="/streaks", tags=["Streaks"])


@router.get("/current", response_model=StreakResponse)
@limiter.limit("100/minute;1000/hour")
async def get_current_streak(
    request: Request,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    streak = get_user_streak(current_user.id, db, current_user.current_semester_id)
    return streak_to_response(streak)


@router.post("/update", response_model=StreakResponse)
@limiter.limit("30/minute;300/hour")
async def update_streak(
    request: Request,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    streak = update_user_streak(current_user.id, db, current_user.current_semester_id)
    return streak_to_response(streak)
