"""Evidence router — file upload with SHA-256 hashing."""

import os
import hashlib
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Case, Evidence
from backend.schemas import EvidenceOut
from backend.routers.auth import get_current_user
from backend.models import User

router = APIRouter()
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB limit

ALLOWED_EXTENSIONS = {
    "image": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"],
    "video": [".mp4", ".avi", ".mov", ".mkv", ".webm"],
    "pdf":   [".pdf"],
    "zip":   [".zip", ".tar", ".gz", ".7z"],
    "log":   [".log", ".txt", ".csv"],
}

def detect_file_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    for ft, exts in ALLOWED_EXTENSIONS.items():
        if ext in exts:
            return ft
    return "other"

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


@router.post("/upload/{case_id}", response_model=EvidenceOut, status_code=201)
async def upload_evidence(
    case_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    case = db.query(Case).filter(Case.id == case_id, Case.owner_id == current.id).first()
    if not case:
        raise HTTPException(404, "Case not found")

    contents = await file.read()

    # Enforce file size limit
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(413, f"File too large. Maximum allowed size is 100 MB.")

    # SHA-256 hash for integrity verification
    file_hash = sha256_bytes(contents)

    # Save file
    case_dir  = os.path.join(UPLOAD_DIR, str(case_id))
    os.makedirs(case_dir, exist_ok=True)
    safe_name = f"{file_hash[:8]}_{file.filename}"
    file_path = os.path.join(case_dir, safe_name)

    with open(file_path, "wb") as f:
        f.write(contents)

    ev = Evidence(
        filename    = file.filename,
        file_path   = file_path,
        sha256_hash = file_hash,
        file_type   = detect_file_type(file.filename),
        case_id     = case_id,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.get("/case/{case_id}", response_model=List[EvidenceOut])
def list_evidence(case_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == case_id, Case.owner_id == current.id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    return case.evidences


@router.get("/all", response_model=List[EvidenceOut])
def list_all_evidence(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    user_cases = db.query(Case).filter(Case.owner_id == current.id).all()
    case_ids = [c.id for c in user_cases]
    if not case_ids:
        return []
    evidences = db.query(Evidence).filter(Evidence.case_id.in_(case_ids)).all()
    return evidences


@router.delete("/{evidence_id}")
def delete_evidence(evidence_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(404, "Evidence not found")
    # Verify case ownership
    case = db.query(Case).filter(Case.id == ev.case_id, Case.owner_id == current.id).first()
    if not case:
        raise HTTPException(403, "Not authorized")
    if os.path.exists(ev.file_path):
        os.remove(ev.file_path)
    db.delete(ev)
    db.commit()
    return {"message": "Evidence deleted"}
