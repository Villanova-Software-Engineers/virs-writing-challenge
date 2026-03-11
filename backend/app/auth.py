async def get_current_user():
    return {"uid": "test_user", "email": "test@villanova.edu"}

async def require_admin():
    return {"uid": "admin", "email": "admin@villanova.edu", "is_admin": True}