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

# Start the FastAPI server using Gunicorn with Uvicorn workers for production optimization
echo "Starting FastAPI server on port ${PORT:-8000} using Gunicorn..."
exec gunicorn backend.main:app \
    --bind 0.0.0.0:${PORT:-8000} \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
