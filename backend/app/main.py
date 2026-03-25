from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .core import settings, limiter, initialize_firebase
from .api import health_router
from .api.semester import router as semesters_router
from .api.messages import router as messages_router
from .api.streaks  import router as streaks_router
from .api.leaderboard import router as leaderboard_router
from .api.profile import router as profile_router
from .api.sessions import router as sessions_router
from .api.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_firebase()
    yield
    
app = FastAPI(
    title=settings.project_name,
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(semesters_router, prefix="/api")
app.include_router(messages_router, prefix="/api")
app.include_router(streaks_router, prefix="/api")
app.include_router(leaderboard_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

@app.get("/")
async def read_root():
    return {"message": "VIRS Writing Challenge API is running!"}