from app.api.deps import (
    APIRouter, Depends, Request, Session,
    limiter, get_db, CurrentUser,
    get_current_user, require_semester_registration,
)
from app.schemas.profile import UserProfileResponse, UserProfileUpdate, UserStats, UserStatsHistory
from app.crud.profile import get_user_profile, update_user_profile, get_user_stats, get_user_stats_history

router = APIRouter(prefix="/profile", tags=["Profile"])


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("", response_model=UserProfileResponse)
@limiter.limit("100/minute;1000/hour")
async def get_profile(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's profile"""
    return get_user_profile(
        db=db,
        user_id=current_user.id,
        uid=current_user.uid,
        email=current_user.email,
        is_admin=current_user.is_admin,
    )


@router.patch("", response_model=UserProfileResponse)
@limiter.limit("30/minute;300/hour")
async def update_profile(
    request: Request,
    data: UserProfileUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's profile"""
    return update_user_profile(
        db=db,
        user_id=current_user.id,
        uid=current_user.uid,
        email=current_user.email,
        is_admin=current_user.is_admin,
        data=data,
    )


@router.get("/stats", response_model=UserStats)
@limiter.limit("100/minute;1000/hour")
async def get_profile_stats(
    request: Request,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    """Get the current user's writing statistics"""
    return get_user_stats(db=db, user_id=current_user.id, semester_id=current_user.current_semester_id)


@router.get("/history", response_model=UserStatsHistory)
@limiter.limit("60/minute;600/hour")
async def get_profile_history(
    request: Request,
    current_user: CurrentUser = Depends(require_semester_registration),
    db: Session = Depends(get_db),
):
    """Get the current user's historical statistics by semester"""
    return get_user_stats_history(db=db, user_id=current_user.id)
