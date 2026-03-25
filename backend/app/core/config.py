from dotenv import load_dotenv
import os
from typing import List

load_dotenv()

class Settings:
    def __init__(self):
        self.database_url: str = os.getenv("DATABASE_URL", "")
        self.firebase_cred_path: str = os.getenv("FIREBASE_CRED_PATH", "")
        self.project_name: str = "VIRS-Writing-Challenge"

        cors_env = os.getenv("CORS_ORIGINS", "")
        if cors_env:
            self.cors_origins: List[str] = [origin.strip() for origin in cors_env.split(",")]
        else:
            # Default origins for development
            self.cors_origins: List[str] = [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "http://127.0.0.1:3000",
            ]

settings = Settings()