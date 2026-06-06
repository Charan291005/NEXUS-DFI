FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (needed for psycopg2 and reportlab)
RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application files
COPY backend/ backend/
COPY seed.py .

# Copy entrypoint script and make it executable
COPY backend/entrypoint.sh .
RUN chmod +x entrypoint.sh

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
