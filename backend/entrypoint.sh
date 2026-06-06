#!/bin/sh
set -e

# Wait for Postgres to be ready if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo "Waiting for PostgreSQL to become available..."
    # A simple wait loop could be added here using pg_isready if postgresql-client is installed
    # Alternatively, SQLAlchemy create_all handles connection retries if configured, but let's just sleep briefly
    sleep 5
fi

# Run the seed script to create tables and default admin user
echo "Running database seed and migrations..."
python seed.py

# Start the FastAPI server using Uvicorn
echo "Starting FastAPI server..."
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
