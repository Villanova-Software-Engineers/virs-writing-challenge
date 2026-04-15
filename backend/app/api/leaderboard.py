from app.api.deps import (
    APIRouter, Depends, Request, Session, Optional,
    limiter, get_db, CurrentUser, require_semester_registration,
)
from app.schemas.leaderboard import LeaderboardResponse
from app.crud.leaderboard import get_leaderboard

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("", response_model=LeaderboardResponse)
@limiter.limit("60/minute;600/hour")
async def get_leaderboard_route(
    request: Request,
    semester_id: Optional[int] = None,
    limit: int = 50,
    current_user: CurrentUser = Depends(require_semester_registration),
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
