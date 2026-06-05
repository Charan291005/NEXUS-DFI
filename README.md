# NexusDFI — Next-Generation Digital Forensics Intelligence

> **Transforming Digital Evidence into Actionable Intelligence**

An AI-powered full-stack Digital Forensics Intelligence Platform built with React + TypeScript (frontend) and FastAPI + Python (backend). Designed to impress recruiters and judges with a premium, enterprise-grade cybersecurity product.

---

## 🚀 Features

| Module | Description |
|--------|-------------|
| **Investigation Dashboard** | Animated stats, charts, activity feed, threat alerts |
| **Case Management** | Full CRUD — create, track, archive, filter cases |
| **Evidence Management** | Drag-drop upload, SHA-256 integrity hashing, type detection |
| **Image Forensics (ELA)** | Error Level Analysis, metadata extraction, tampering detection |
| **Deepfake Detection** | Frequency-domain GAN fingerprint + facial analysis |
| **Log Analysis** | Regex-based anomaly detection, timeline reconstruction |
| **AI Investigation Assistant** | Context-aware forensic Q&A with expert responses |
| **Timeline Reconstruction** | Chronological case event visualization |
| **Risk Assessment Engine** | 0–100 risk scoring with animated meters |
| **PDF Report Generator** | Professional, court-ready forensic reports via ReportLab |

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + TypeScript (Vite)
- Tailwind CSS (dark theme, glassmorphism)
- Framer Motion (page transitions, card animations)
- Recharts (area, bar, pie charts)
- React Router DOM
- React Hook Form

**Backend**
- FastAPI (Python)
- SQLAlchemy + SQLite
- Pillow + OpenCV (image forensics)
- ReportLab (PDF generation)
- JWT Authentication + SHA-256 hashing
- bcrypt (password security)

---

## ⚡ Quick Start

### Frontend (works offline with mock data)

```bash
npm install
npm run dev
```

Open: http://localhost:5173

### Backend (enables full functionality)

```bash
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
python seed.py
python -m uvicorn backend.main:app --reload --port 8000
```

API docs: http://localhost:8000/api/docs

---

## 🔐 Demo Credentials

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin123 | Admin |

> The frontend works fully in offline/demo mode with intelligent mock data — no backend required.

---

## 📁 Project Structure

```
NexusDFI/
├── src/                   # React frontend
│   ├── pages/             # 7 page components
│   ├── components/        # Layout, UI library
│   ├── context/           # Auth context
│   └── utils/             # API client, helpers
├── backend/               # FastAPI backend
│   ├── routers/           # auth, cases, evidence, analysis
│   ├── models.py          # SQLAlchemy ORM
│   ├── ai_engine.py       # ELA, deepfake, log analysis
│   └── main.py
├── seed.py
└── README.md
```

---

## 🎨 Design

Premium dark theme · Glassmorphism cards · Framer Motion animations  
Recharts data visualization · CrowdStrike/Splunk-inspired enterprise UX

---

*NexusDFI v2.5.0 — Built for placements, interviews, and hackathons*
