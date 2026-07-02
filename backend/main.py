"""
NexusDFI Backend — FastAPI Application
Run: uvicorn backend.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
import os

from backend.database import engine, Base
from backend.routers import auth, cases, evidence, analysis, news, osint

# Create DB tables
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="NexusDFI — Digital Forensics Intelligence API",
    description="AI-powered digital forensics analysis platform",
    version="3.0.0",
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
app.add_middleware(GZipMiddleware, minimum_size=1000)

from fastapi.responses import JSONResponse
from fastapi import Request, HTTPException

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "message": exc.detail},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"error": True, "message": "An unexpected internal server error occurred."},
    )
# Static file serving for uploaded evidence
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(auth.router,     prefix="/api/auth",     tags=["Authentication"])
app.include_router(cases.router,    prefix="/api/cases",    tags=["Cases"])
app.include_router(evidence.router, prefix="/api/evidence", tags=["Evidence"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(news.router,     prefix="/api/news",     tags=["News"])
app.include_router(osint.router,    prefix="/api/osint",    tags=["OSINT"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "platform": "NexusDFI",
        "version":  "3.0.0",
        "status":   "operational",
        "tagline":  "Transforming Digital Evidence into Actionable Intelligence",
    }


@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "ok", "database": "connected"}
