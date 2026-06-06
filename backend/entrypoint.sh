#!/bin/sh
set -e

echo "NexusDFI backend starting..."

# Run database migrations (create tables if not exist)
python -c "from backend.database import engine, Base; from backend import models; Base.metadata.create_all(bind=engine); print('Tables ready.')"

# Run seed only if the database has no users yet (idempotent)
USERCOUNT=$(python -c "
from backend.database import SessionLocal
from backend.models import User
db = SessionLocal()
count = db.query(User).count()
db.close()
print(count)
")

if [ "$USERCOUNT" = "0" ]; then
    echo "Empty database detected. Running seed..."
    python seed.py
else
    echo "Database already initialized ($USERCOUNT users found). Skipping seed."
fi

# Start the FastAPI server using Uvicorn with optimal settings for Cloud Run
echo "Starting FastAPI server on port ${PORT:-8000}..."
exec uvicorn backend.main:app \
    --host 0.0.0.0 \
    --port ${PORT:-8000} \
    --workers 1 \
    --no-access-log
