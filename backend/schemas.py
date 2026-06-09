"""Pydantic schemas for request/response validation."""

from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel


# ── Auth ──────────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenOut(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ── Cases ─────────────────────────────────────────────────
class CaseCreate(BaseModel):
    case_id:     str
    title:       str
    description: Optional[str] = ""
    status:      str = "Open"
    priority:    str = "Medium"

class CaseUpdate(BaseModel):
    title:       Optional[str] = None
    description: Optional[str] = None
    status:      Optional[str] = None
    priority:    Optional[str] = None

class CaseOut(BaseModel):
    id:             int
    case_id:        str
    title:          str
    description:    str
    status:         str
    priority:       str
    created_at:     datetime
    updated_at:     datetime
    owner_id:       int
    evidence_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ── Evidence ──────────────────────────────────────────────
class EvidenceOut(BaseModel):
    id:          int
    filename:    str
    file_path:   str
    sha256_hash: str
    file_type:   str
    uploaded_at: datetime
    case_id:     int

    class Config:
        from_attributes = True


# ── Analysis ──────────────────────────────────────────────
class AnalysisResultOut(BaseModel):
    id:          int
    evidence_id: int
    module:      str
    result:      Dict[str, Any]
    risk_score:  int
    created_at:  datetime

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_cases:           int
    active_investigations: int
    evidence_files:        int
    high_risk_findings:    int
    deepfake_detections:   int
    cases_this_week:       int
    risk_distribution:     List[Dict[str, Any]]
    evidence_by_type:      List[Dict[str, Any]]
    recent_activity:       List[Dict[str, Any]]
    weekly_cases:          List[Dict[str, Any]]


# ── AI Assistant ──────────────────────────────────────────
class AssistantQuery(BaseModel):
    question: str
    context:  Optional[str] = ""
    persona:  Optional[str] = "nexus"

class AssistantResponse(BaseModel):
    response: str
