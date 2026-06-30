from functools import lru_cache
import os

class Settings:
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./nexusdfi.db")
        self.disable_wal = os.getenv("DISABLE_WAL", "False") == "True"
        self.secret_key = os.getenv("SECRET_KEY", "nexusdfi-secret-key-change-in-production-2024")
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 1440

@lru_cache()
def get_settings() -> Settings:
    return Settings()
