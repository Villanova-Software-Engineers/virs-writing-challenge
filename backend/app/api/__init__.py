from .health import router as health_router
from .semester import router as semesters_router
from .messages import router as messages_router
from .streaks import router as streaks_router
from .leaderboard import router as leaderboard_router
from .profile import router as profile_router
from .sessions import router as sessions_router
from .admin import router as admin_router

__all__ = [
    "health_router",
    "semesters_router",
    "messages_router",
    "streaks_router",
    "leaderboard_router",
    "profile_router",
    "sessions_router",
    "admin_router",
]