from .health import router as health_router
from .semester import router as semester_router
from .messages import router as messages_router

__all__ = ["health_router", "semester_router", "messages_router"]