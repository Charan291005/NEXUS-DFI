"""
Seed script — creates a default admin user and sample cases.
Run: python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from backend.database import engine, Base, SessionLocal
from backend.models import User, Case
from backend.auth import hash_password
from datetime import datetime, timedelta
import random

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── Admin user ────────────────────────────────────────────
existing = db.query(User).filter(User.username == "admin").first()
if not existing:
    admin = User(username="admin", hashed_password=hash_password("admin123"), role="Admin")
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print("Admin user created: admin / admin123")
else:
    admin = existing
    print("Admin user already exists")

# ── Sample cases ──────────────────────────────────────────
SAMPLE_CASES = [
    ("NXDFI-2605-4821", "Operation Shadow Storm",    "Multi-vector phishing campaign targeting financial institutions.", "Active",   "Critical"),
    ("NXDFI-2605-3317", "Insider Threat – DevOps",  "Suspicious data exfiltration from internal DevOps repository.",    "Active",   "High"    ),
    ("NXDFI-2605-9102", "Deepfake Political Video",  "Viral video suspected to contain AI-generated facial content.",    "Open",     "High"    ),
    ("NXDFI-2605-1244", "Ransomware Incident R9X",  "Post-incident forensics for ransomware attack on healthcare.",     "Closed",   "Critical"),
    ("NXDFI-2605-7763", "Social Engineering Probe",  "Image-based social engineering for security awareness training.", "Archived", "Low"     ),
    ("NXDFI-2605-5528", "Supply Chain Compromise",   "Compromised NPM package with obfuscated malicious payload.",      "Active",   "Critical"),
]

for case_id, title, desc, status, priority in SAMPLE_CASES:
    if not db.query(Case).filter(Case.case_id == case_id).first():
        days_ago = random.randint(1, 30)
        case = Case(
            case_id=case_id, title=title, description=desc,
            status=status, priority=priority, owner_id=admin.id,
            created_at=datetime.utcnow() - timedelta(days=days_ago),
        )
        db.add(case)
        print(f"  + Case: {case_id}")

db.commit()
db.close()
print("\nSeed complete! Start backend: python -m uvicorn backend.main:app --reload")
