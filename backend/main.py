"""
NexusDFI Backend — FastAPI Application
Run: uvicorn backend.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from backend.database import engine, Base
from backend.routers import auth, cases, evidence, analysis

# Create DB tables
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="NexusDFI — Digital Forensics Intelligence API",
    description="AI-powered digital forensics analysis platform",
    version="2.5.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS — allow frontend origins explicitly
ALLOWED_ORIGINS = [
    "http://localhost:5173",           # Vite dev server
    "http://localhost:4173",           # Vite preview
    "https://nexusdfi.web.app",        # Firebase Hosting (production)
    "https://nexusdfi.firebaseapp.com", # Firebase alternate domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploaded evidence
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(auth.router,     prefix="/api/auth",     tags=["Authentication"])
app.include_router(cases.router,    prefix="/api/cases",    tags=["Cases"])
app.include_router(evidence.router, prefix="/api/evidence", tags=["Evidence"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "platform": "NexusDFI",
        "version":  "2.5.0",
        "status":   "operational",
        "tagline":  "Transforming Digital Evidence into Actionable Intelligence",
    }


@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "ok", "database": "connected"}
