"""
Common dependencies and imports for API routes.

This module consolidates frequently used imports to reduce repetition
across API endpoint files.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core import limiter
from app.core.database import get_db
from app.schemas.auth import CurrentUser
from app.api.auth import get_current_user, require_semester_registration, require_admin

__all__ = [
    # FastAPI
    "APIRouter",
    "Depends",
    "HTTPException",
    "Request",
    "status",
    # SQLAlchemy
    "Session",
    # Typing
    "Optional",
    # Core
    "limiter",
    "get_db",
    # Auth
    "CurrentUser",
    "get_current_user",
    "require_semester_registration",
    "require_admin",
]
