"""Cases router — CRUD + dashboard stats."""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Case, Evidence, AnalysisResult
from backend.schemas import CaseCreate, CaseUpdate, CaseOut, DashboardStats
from backend.routers.auth import get_current_user
from backend.models import User

router = APIRouter()


@router.get("/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    total_cases = db.query(Case).filter(Case.owner_id == current.id).count()
    active      = db.query(Case).filter(Case.owner_id == current.id, Case.status == "Active").count()
    ev_count    = db.query(Evidence).join(Case).filter(Case.owner_id == current.id).count()
    high_risk   = db.query(AnalysisResult).filter(AnalysisResult.risk_score >= 60).count()
    deepfakes   = db.query(AnalysisResult).filter(AnalysisResult.module == "deepfake_detection", AnalysisResult.risk_score >= 60).count()
    this_week   = db.query(Case).filter(Case.owner_id == current.id, Case.created_at >= week_ago).count()

    risk_dist = [
        {"level": "Critical", "count": db.query(AnalysisResult).filter(AnalysisResult.risk_score >= 80).count()},
        {"level": "High",     "count": db.query(AnalysisResult).filter(AnalysisResult.risk_score.between(60, 79)).count()},
        {"level": "Medium",   "count": db.query(AnalysisResult).filter(AnalysisResult.risk_score.between(40, 59)).count()},
        {"level": "Low",      "count": db.query(AnalysisResult).filter(AnalysisResult.risk_score.between(20, 39)).count()},
        {"level": "Safe",     "count": db.query(AnalysisResult).filter(AnalysisResult.risk_score < 20).count()},
    ]

    evidence_by_type = [
        {"type": t, "count": db.query(Evidence).filter(Evidence.file_type == t).count()}
        for t in ["image", "video", "log", "pdf", "zip"]
    ]

    weekly_cases = []
    for i in range(6, -1, -1):
        d = now - timedelta(days=i)
        start = d.replace(hour=0, minute=0, second=0, microsecond=0)
        end   = start + timedelta(days=1)
        count = db.query(Case).filter(Case.created_at.between(start, end)).count()
        weekly_cases.append({"day": d.strftime("%a"), "count": count})

    return DashboardStats(
        total_cases=total_cases, active_investigations=active,
        evidence_files=ev_count, high_risk_findings=high_risk,
        deepfake_detections=deepfakes, cases_this_week=this_week,
        risk_distribution=risk_dist, evidence_by_type=evidence_by_type,
        recent_activity=[], weekly_cases=weekly_cases,
    )


@router.get("/", response_model=List[CaseOut])
def list_cases(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    q = db.query(Case).filter(Case.owner_id == current.id)
    if status:   q = q.filter(Case.status == status)
    if priority: q = q.filter(Case.priority == priority)
    cases = q.order_by(Case.created_at.desc()).all()

    result = []
    for c in cases:
        c_dict = CaseOut.from_orm(c).__dict__
        c_dict["evidence_count"] = len(c.evidences)
        result.append(CaseOut(**c_dict))
    return result


@router.post("/", response_model=CaseOut, status_code=201)
def create_case(data: CaseCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    if db.query(Case).filter(Case.case_id == data.case_id).first():
        raise HTTPException(400, "Case ID already exists")
    case = Case(**data.dict(), owner_id=current.id)
    db.add(case)
    db.commit()
    db.refresh(case)
    out = CaseOut.from_orm(case)
    out.evidence_count = 0
    return out


@router.get("/{case_id}", response_model=CaseOut)
def get_case(case_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == case_id, Case.owner_id == current.id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    out = CaseOut.from_orm(case)
    out.evidence_count = len(case.evidences)
    return out


@router.put("/{case_id}", response_model=CaseOut)
def update_case(case_id: int, data: CaseUpdate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == case_id, Case.owner_id == current.id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    for k, v in data.dict(exclude_none=True).items():
        setattr(case, k, v)
    case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(case)
    return case


@router.delete("/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == case_id, Case.owner_id == current.id).first()
    if not case:
        raise HTTPException(404, "Case not found")
    db.delete(case)
    db.commit()
    return {"message": "Case deleted"}
