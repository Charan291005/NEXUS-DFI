# NexusDFI — Digital Forensics Intelligence Platform

<div align="center">

![NexusDFI](https://img.shields.io/badge/NexusDFI-v3.0.0-F05A28?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTVMMTIgMnptMCAxM0wyIDEwdjVsMTAgNSAxMC01di01bC0xMCA1eiIvPjwvc3ZnPg==)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi)
![Firebase](https://img.shields.io/badge/Firebase-Hosting-FFCA28?style=for-the-badge&logo=firebase)
![Cloud Run](https://img.shields.io/badge/Cloud_Run-Deployed-4285F4?style=for-the-badge&logo=googlecloud)
![License](https://img.shields.io/badge/License-MIT-00D4AA?style=for-the-badge)

**Transforming Digital Evidence into Actionable Intelligence**

[🌐 Live Demo](https://nexusdfi.web.app) · [🔧 API Docs](https://nexusdfi-backend-741401327113.us-central1.run.app/api/docs) · [📁 Repository](https://github.com/Charan291005/NEXUS-DFI)

</div>

---

## 🔍 Overview

**NexusDFI** is an AI-powered, enterprise-grade Digital Forensics Intelligence platform built with React + TypeScript (frontend) and FastAPI + Python (backend). It integrates Google Gemini AI, Firebase authentication, and advanced forensic analysis algorithms into a premium CrowdStrike-inspired dark UI.

Designed for law enforcement, security researchers, forensic analysts, and hackathon judges.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🏠 **Intelligence Dashboard** | Animated stat counters, area charts, pie charts, real-time activity feed |
| 📂 **Case Management** | Full CRUD — create, filter, archive forensic investigation cases |
| 🔍 **Evidence Management** | Drag-drop upload, SHA-256 integrity hash, MIME type detection, chain-of-custody |
| 🖼️ **Image Forensics (ELA)** | Error Level Analysis, metadata extraction, tampering probability score |
| 🤖 **Deepfake Detection** | GAN fingerprint frequency analysis + facial landmark detection |
| 📋 **Log Analysis** | Regex-based anomaly detection, IP extraction, timeline reconstruction |
| 💬 **AI Investigation Assistant** | Context-aware forensic Q&A powered by Google Gemini (`gemini-2.0-flash-exp`) |
| ⏱️ **Timeline Reconstruction** | Chronological case event visualization |
| 📊 **Risk Assessment Engine** | 0–100 animated risk scoring with multi-level classification |
| 📑 **PDF Report Generator** | Court-ready forensic reports via ReportLab with chain-of-custody |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + TypeScript (Vite 8 build)
- **Tailwind CSS v4** — CrowdStrike-inspired dark theme with glassmorphism
- **Framer Motion 12** — Page transitions, micro-animations, stagger effects
- **Recharts 3** — Area, Bar, Pie charts with animated gradients
- **React Router DOM 7**
- **React Hook Form 7**
- **Firebase Client SDK 12** — Google Sign-In OAuth authentication

### Backend
- **FastAPI** (Python) — Async REST API
- **SQLAlchemy + SQLite** — ORM with WAL mode for concurrent reads
- **Pillow + OpenCV** — Image forensics (ELA, metadata)
- **ReportLab** — PDF generation
- **Firebase Admin SDK** — ID token verification
- **Google Gemini API** — AI Investigation Assistant

### Infrastructure
- **Frontend**: Firebase Hosting (`nexusdfi.web.app`)
- **Backend**: Google Cloud Run (us-central1, serverless autoscale)
- **Auth**: Firebase Google OAuth → JWT token verification

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+ and npm
- Python 3.11+
- Firebase CLI (`npm install -g firebase-tools`)

### 1. Clone & Install Frontend

```bash
git clone https://github.com/Charan291005/NEXUS-DFI.git
cd NEXUS-DFI
npm install
npm run dev
```

Open: **http://localhost:5173**

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (macOS/Linux)
# source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Seed database (optional — idempotent)
python seed.py

# Start FastAPI server
python -m uvicorn backend.main:app --reload --port 8000
```

API Docs: **http://localhost:8000/api/docs**

---

## 🔐 Authentication & Access

NexusDFI uses **Firebase Google Sign-In** for authentication:

1. Users click "Continue with Google" on the login page
2. Firebase returns an ID token
3. Frontend sends the token as `Authorization: Bearer <token>` header on every API request
4. Backend FastAPI verifies the token with Firebase Admin SDK
5. On first login, the user is automatically provisioned in the SQLite database

**No manual registration needed.** Any Google account can sign in.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Required: Google Gemini API Key for AI Assistant
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Firebase service account (not needed on Cloud Run)
# GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Optional: Override API URL in development
VITE_API_URL=http://localhost:8000
```

### Getting a Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` as `GEMINI_API_KEY`

---

## 🚀 Deployment

### Frontend — Firebase Hosting

```bash
# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Live at: **https://nexusdfi.web.app**

### Backend — Google Cloud Run

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/nexusdfi/backend

# Deploy to Cloud Run
gcloud run deploy nexusdfi-backend \
  --image gcr.io/nexusdfi/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key_here
```

API live at: **https://nexusdfi-backend-741401327113.us-central1.run.app**

---

## 📁 Project Structure

```
NexusDFI/
├── src/                        # React frontend
│   ├── pages/                  # 8 page components
│   │   ├── LoginPage.tsx       # Split-panel cinematic login
│   │   ├── Dashboard.tsx       # Stats, charts, activity feed
│   │   ├── CaseList.tsx        # Case CRUD with table filters
│   │   ├── CaseDetail.tsx      # Case view with evidence list
│   │   ├── EvidencePage.tsx    # Drag-drop upload + analysis
│   │   ├── TimelinePage.tsx    # Chronological event view
│   │   ├── ReportsPage.tsx     # PDF report generator
│   │   └── AssistantPage.tsx   # Gemini AI chat interface
│   ├── components/
│   │   ├── Layout.tsx          # Sidebar + header shell
│   │   └── ui.tsx              # StatCard, Badge, Spinner, RiskMeter...
│   ├── context/
│   │   └── AuthContext.tsx     # Firebase auth state + logout
│   ├── utils/
│   │   ├── api.ts              # Axios client with auth interceptors
│   │   └── helpers.ts          # formatDate, riskColor, generateCaseId
│   ├── firebase.ts             # Firebase app init
│   ├── types.ts                # TypeScript interfaces
│   └── index.css               # Tailwind v4 + custom design system
├── backend/
│   ├── routers/
│   │   ├── auth.py             # Firebase token verification + user provisioning
│   │   ├── cases.py            # Case CRUD + dashboard stats + activity feed
│   │   ├── evidence.py         # File upload, hash, MIME detection
│   │   └── analysis.py         # ELA, deepfake, log analysis, Gemini, PDF
│   ├── ai_engine.py            # Core forensic algorithms + Gemini integration
│   ├── models.py               # SQLAlchemy ORM (User, Case, Evidence, AnalysisResult)
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── database.py             # SQLite engine + WAL mode
│   └── main.py                 # FastAPI app + CORS + routers
├── Dockerfile.backend          # Cloud Run optimized backend image
├── Dockerfile.frontend         # Nginx-based frontend image
├── docker-compose.yml          # Local full-stack development
├── firebase.json               # Firebase Hosting config (SPA rewrites)
├── seed.py                     # Idempotent DB seed with sample cases
└── README.md
```

---

## 🎨 Design System

The UI is inspired by **CrowdStrike Falcon** and **Splunk Enterprise** with:

- **Primary color**: Burnt Orange `#F05A28` — action buttons, active nav, alerts
- **Secondary color**: Electric Teal `#00D4AA` — status indicators, secondary actions
- **Background**: Deep Navy `#070B14` with layered radial gradients
- **Cards**: Glassmorphism with `backdrop-filter: blur(14px)` and subtle border glows
- **Typography**: `Outfit` for headings, `Inter` for body, `JetBrains Mono` for code/IDs
- **Animations**: Framer Motion page transitions, stagger reveals, animated counters
- **Sidebar**: Collapsible with scan-line effect and logo pulse ring

---

## 🐛 Known Issues / FAQ

**Q: Login button doesn't work?**  
A: Ensure the Firebase project (`nexusdfi`) has Google Sign-In enabled. Check browser console for auth errors.

**Q: Reports show "Backend offline" error?**  
A: PDF generation requires the backend server. Either run `uvicorn backend.main:app --port 8000` locally, or the Cloud Run backend must be accessible.

**Q: Activity feed is empty on dashboard?**  
A: Fixed in v3.0.0 — the feed now shows real events. You need at least one case or uploaded evidence to see entries.

**Q: CORS errors in local development?**  
A: Ensure your frontend runs on `http://localhost:5173` (the Vite default). The backend CORS whitelist includes this origin.

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

*NexusDFI v3.0.0 — Built with ❤️ for placements, hackathons, and forensic research*

**[⬆ Back to Top](#nexusdfi--digital-forensics-intelligence-platform)**

</div>
