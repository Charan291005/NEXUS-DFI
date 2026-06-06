"""Cases router — CRUD + dashboard stats (optimized)."""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
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

    # Optimized: single query per table instead of many separate counts
    case_stats = db.query(
        func.count(Case.id).label("total"),
        func.sum(func.cast(Case.status == "Active", int)).label("active"),
        func.sum(func.cast(Case.created_at >= week_ago, int)).label("this_week"),
    ).filter(Case.owner_id == current.id).first()

    total_cases   = case_stats.total or 0
    active_count  = int(case_stats.active or 0)
    cases_week    = int(case_stats.this_week or 0)

    ev_count = db.query(func.count(Evidence.id)).join(Case).filter(
        Case.owner_id == current.id
    ).scalar() or 0

    # Analysis risk aggregations
    risk_rows = db.query(AnalysisResult.risk_score, AnalysisResult.module).join(
        Evidence
    ).join(Case).filter(Case.owner_id == current.id).all()

    high_risk  = sum(1 for r in risk_rows if r.risk_score >= 60)
    deepfakes  = sum(1 for r in risk_rows if r.module == "deepfake_detection" and r.risk_score >= 60)

    risk_dist = [
        {"level": "Critical", "count": sum(1 for r in risk_rows if r.risk_score >= 80)},
        {"level": "High",     "count": sum(1 for r in risk_rows if 60 <= r.risk_score < 80)},
        {"level": "Medium",   "count": sum(1 for r in risk_rows if 40 <= r.risk_score < 60)},
        {"level": "Low",      "count": sum(1 for r in risk_rows if 20 <= r.risk_score < 40)},
        {"level": "Safe",     "count": sum(1 for r in risk_rows if r.risk_score < 20)},
    ]

    # Evidence type distribution — single query
    ev_types = db.query(Evidence.file_type, func.count(Evidence.id)).join(Case).filter(
        Case.owner_id == current.id
    ).group_by(Evidence.file_type).all()
    ev_type_map = {t: c for t, c in ev_types}
    evidence_by_type = [
        {"type": t, "count": ev_type_map.get(t, 0)}
        for t in ["image", "video", "log", "pdf", "zip"]
    ]

    # Weekly cases — single query grouped
    weekly_raw = db.query(
        func.date(Case.created_at).label("day"),
        func.count(Case.id).label("count"),
    ).filter(Case.created_at >= week_ago).group_by(func.date(Case.created_at)).all()
    weekly_map = {str(r.day): r.count for r in weekly_raw}

    weekly_cases = []
    for i in range(6, -1, -1):
        d = now - timedelta(days=i)
        key = d.strftime("%Y-%m-%d")
        weekly_cases.append({"day": d.strftime("%a"), "count": weekly_map.get(key, 0)})

    return DashboardStats(
        total_cases=total_cases, active_investigations=active_count,
        evidence_files=ev_count, high_risk_findings=high_risk,
        deepfake_detections=deepfakes, cases_this_week=cases_week,
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

    # Optimized: single count query for all cases instead of N+1 lazy loads
    case_ids = [c.id for c in cases]
    if case_ids:
        ev_counts = dict(
            db.query(Evidence.case_id, func.count(Evidence.id))
            .filter(Evidence.case_id.in_(case_ids))
            .group_by(Evidence.case_id)
            .all()
        )
    else:
        ev_counts = {}

    result = []
    for c in cases:
        out = CaseOut.from_orm(c)
        out.evidence_count = ev_counts.get(c.id, 0)
        result.append(out)
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
    out.evidence_count = db.query(func.count(Evidence.id)).filter(Evidence.case_id == case_id).scalar() or 0
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
