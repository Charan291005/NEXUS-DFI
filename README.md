# NexusDFI — Next-Generation Digital Forensics Intelligence

> **Transforming Digital Evidence into Actionable Intelligence**

An AI-powered full-stack Digital Forensics Intelligence Platform built with React + TypeScript (frontend) and FastAPI + Python (backend). Powered by Google Gemini and Firebase. Designed to impress recruiters and judges with a premium, enterprise-grade cybersecurity product.

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
| **AI Investigation Assistant** | Context-aware forensic Q&A powered by Google Gemini API (`gemini-flash-latest`) |
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
- Firebase Client SDK (Google Sign-In authentication)

**Backend**
- FastAPI (Python)
- SQLAlchemy + SQLite
- Pillow + OpenCV (image forensics)
- ReportLab (PDF generation)
- Firebase Admin SDK (ID token verification & authentication)
- Google Gemini API (via HTTP client for context-aware Q&A)

---

## ⚡ Quick Start

### 1. Frontend Setup

```bash
npm install
npm run dev
```

Open: http://localhost:5173

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Seed the database (optional - seeding is now idempotent)
python seed.py

# Run FastAPI server
python -m uvicorn backend.main:app --reload --port 8000
```

API docs: http://localhost:8000/api/docs

---

## 🔐 Authentication & Access

Access to NexusDFI is authenticated via **Firebase Google Sign-In**. 

- **Frontend**: Connects to Firebase Auth to sign in users with their Google Accounts.
- **Backend**: Verifies incoming Firebase ID tokens using the Firebase Admin SDK.
- **Auto-Provisioning**: On first successful Google Sign-In, the backend automatically registers a user profile in the local SQLite database.

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in the root or set environment variables in your terminal:

### Backend Configuration

- `GEMINI_API_KEY`: **(Required)** Your Google Gemini API Key, enabling the AI Investigation Assistant.
- `GOOGLE_APPLICATION_CREDENTIALS`: *(Optional)* Path to your Firebase service account key JSON file. (Note: Not required when running in Google Cloud Run with Workload Identity or GCP metadata server configuration).

### Frontend Configuration

- `VITE_API_URL`: *(Optional)* API base URL for development (defaults to `http://localhost:8000`).

---

## 🚀 Production Deployment

### Backend (Google Cloud Run)
The backend is containerized via `Dockerfile.backend` and configured for serverless scale:
- Runs FastAPI on Uvicorn with optimized workers.
- Automatically initializes SQLite tables and seed data if the database is empty.
- Connects securely using Google Cloud metadata services.

### Frontend
Deployable on static hosting platforms such as Firebase Hosting, Netlify, or Vercel.

---

## 📁 Project Structure

```
NexusDFI/
├── src/                   # React frontend
│   ├── pages/             # 8 page components (including Login, Assistant)
│   ├── components/        # Layout, UI library
│   ├── context/           # Auth context (Firebase integration)
│   └── utils/             # API client, helpers
├── backend/               # FastAPI backend
│   ├── routers/           # auth, cases, evidence, analysis
│   ├── models.py          # SQLAlchemy ORM
│   ├── ai_engine.py       # ELA, deepfake, log analysis, Gemini integration
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
