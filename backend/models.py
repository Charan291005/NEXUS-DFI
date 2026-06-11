"""SQLAlchemy ORM models."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from backend.database import Base


class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role            = Column(String, default="Investigator")
    created_at      = Column(DateTime, default=datetime.utcnow)

    cases = relationship("Case", back_populates="owner", cascade="all, delete-orphan")


class Case(Base):
    __tablename__ = "cases"
    id          = Column(Integer, primary_key=True, index=True)
    case_id     = Column(String, unique=True, index=True, nullable=False)
    title       = Column(String, nullable=False)
    description = Column(Text, default="")
    status      = Column(String, default="Open")
    priority    = Column(String, default="Medium")
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner_id    = Column(Integer, ForeignKey("users.id"))

    owner     = relationship("User", back_populates="cases")
    evidences = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")


class Evidence(Base):
    __tablename__ = "evidences"
    id          = Column(Integer, primary_key=True, index=True)
    filename    = Column(String, nullable=False)
    file_path   = Column(String, nullable=False)
    sha256_hash = Column(String, nullable=False)
    file_type   = Column(String, default="other")
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    case_id     = Column(Integer, ForeignKey("cases.id"))

    case     = relationship("Case", back_populates="evidences")
    analysis = relationship("AnalysisResult", back_populates="evidence", uselist=False, cascade="all, delete-orphan")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    id          = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(Integer, ForeignKey("evidences.id"))
    module      = Column(String)        # "image_forensics" | "deepfake_detection" | "log_analysis"
    result      = Column(Text)          # JSON string
    risk_score  = Column(Integer)       # 0–100
    created_at  = Column(DateTime, default=datetime.utcnow)

    evidence = relationship("Evidence", back_populates="analysis")
