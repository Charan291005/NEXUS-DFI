"""SQLAlchemy database configuration — optimized for Cloud Run."""

import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

from backend.config import get_settings

settings = get_settings()
SQLALCHEMY_DATABASE_URL = settings.database_url

_is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False, "timeout": 30} if _is_sqlite else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    # Connection pool settings for production
    pool_pre_ping=True,        # Test connections before use
    pool_size=5,               # Keep 5 connections open
    max_overflow=10,           # Allow up to 10 extra temporary connections
    pool_timeout=30,           # Wait 30s for a connection before error
    pool_recycle=1800,         # Recycle connections every 30 minutes
) if not _is_sqlite else create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
)

# Enable WAL mode for SQLite — allows concurrent reads while writing
if _is_sqlite and not settings.disable_wal:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=-64000")  # 64MB cache
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# Ensure the directory exists if it's a file-based SQLite database
if _is_sqlite:
    db_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        try:
            os.makedirs(db_dir, exist_ok=True)
        except Exception as e:
            print(f"Warning: Could not create database directory {db_dir}: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
