<div align="center">

# 🔬 NexusDFI
### Digital Forensics Intelligence Platform

[![Version](https://img.shields.io/badge/version-v3.0.0-F05A28?style=for-the-badge&logo=semver&logoColor=white)](https://github.com/Charan291005/NEXUS-DFI/releases)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Cloud Run](https://img.shields.io/badge/Cloud_Run-Live-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Powered-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-00D4AA?style=for-the-badge)](LICENSE)

<br/>

> **Transforming Digital Evidence into Actionable Intelligence**

<br/>

[🌐 **Live Demo**](https://nexusdfi.web.app) &nbsp;·&nbsp; [🔧 **API Docs**](https://nexusdfi-backend-741401327113.us-central1.run.app/api/docs) &nbsp;·&nbsp; [📁 **Repository**](https://github.com/Charan291005/NEXUS-DFI) &nbsp;·&nbsp; [🐛 **Report Bug**](https://github.com/Charan291005/NEXUS-DFI/issues)

<br/>

</div>

---

## 🔍 What is NexusDFI?

**NexusDFI** is an AI-powered, enterprise-grade **Digital Forensics Intelligence** platform built for law enforcement, security researchers, forensic analysts, and competitive hackathons. It integrates:

- 🧠 **Google Gemini AI** — context-aware forensic investigation assistant
- 🔒 **Firebase Auth** — zero-friction Google Sign-In with JWT verification
- 🖼️ **Computer Vision** — ELA image tampering detection via OpenCV + Pillow
- 📊 **Real-time Analytics** — animated dashboards with Recharts
- ☁️ **Cloud-native** — Firebase Hosting frontend + Cloud Run backend

The UI draws inspiration from **CrowdStrike Falcon** and **Splunk Enterprise** — a dark, premium, glassmorphism aesthetic built for power users.

---

## ✨ Feature Modules

| Module | Engine | Description |
|--------|--------|-------------|
| 🏠 **Intelligence Dashboard** | React + Recharts | Animated stat counters, area/pie charts, live activity feed |
| 📂 **Case Management** | FastAPI + SQLite | Full CRUD — create, filter, archive forensic cases |
| 🔍 **Evidence Management** | Multipart + SHA-256 | Drag-drop upload, hash integrity, MIME detection, chain-of-custody |
| 🖼️ **Image Forensics (ELA)** | Pillow + OpenCV | Error Level Analysis, EXIF metadata, tampering probability score |
| 🤖 **Deepfake Detection** | OpenCV + DCT | GAN fingerprint frequency analysis + facial landmark scoring |
| 📋 **Log Analysis** | Python Regex | Anomaly detection, IP extraction, timeline reconstruction |
| 💬 **AI Assistant** | Gemini 2.0 Flash | Context-aware forensic Q&A with streaming chat UI |
| ⏱️ **Timeline Reconstruction** | React | Chronological case event visualization |
| 📊 **Risk Assessment** | Custom engine | 0–100 animated risk meter with 5-level classification |
| 📑 **PDF Report Generator** | ReportLab | Court-ready forensic reports with chain-of-custody |

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### 🖥️ Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 6.0 | Type safety |
| Vite | 8 | Build tool |
| Tailwind CSS | v4 | Styling & design tokens |
| Framer Motion | 12 | Animations & transitions |
| Recharts | 3 | Data visualization |
| React Router | 7 | Client-side routing |
| React Hook Form | 7 | Form management |
| Firebase SDK | 12 | Google Sign-In auth |
| Axios | 1.x | HTTP client with interceptors |

</td>
<td valign="top" width="50%">

### ⚙️ Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| FastAPI | Latest | REST API framework |
| Python | 3.11+ | Runtime |
| SQLAlchemy | 2.x | ORM |
| SQLite | 3 | Database (WAL mode) |
| Pillow | Latest | Image processing |
| OpenCV | Latest | Computer vision |
| ReportLab | Latest | PDF generation |
| Firebase Admin | Latest | Token verification |
| Gemini API | 2.0 Flash | AI assistant |
| Uvicorn | Latest | ASGI server |

</td>
</tr>
</table>

### ☁️ Infrastructure

| Layer | Platform | URL |
|-------|----------|-----|
| **Frontend** | Firebase Hosting | [nexusdfi.web.app](https://nexusdfi.web.app) |
| **Backend** | Google Cloud Run (us-central1) | [API Endpoint](https://nexusdfi-backend-741401327113.us-central1.run.app) |
| **Auth** | Firebase Google OAuth | JWT → FastAPI verification |
| **Container** | Docker + Cloud Build | `Dockerfile.backend` |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                              │
│   React 19 + TypeScript + Vite                                       │
│   ┌────────────┐  ┌─────────────┐  ┌──────────────┐                │
│   │  Dashboard │  │   Cases &   │  │ AI Assistant │                │
│   │  + Charts  │  │  Evidence   │  │  (Gemini)    │                │
│   └────────────┘  └─────────────┘  └──────────────┘                │
│          │               │                 │                         │
│          └───────────────┼─────────────────┘                        │
│                    Axios + JWT Bearer Token                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS
          ┌──────────────────▼──────────────────────┐
          │         Firebase Auth (Google OAuth)     │
          │         ID Token → Firebase Admin SDK    │
          └──────────────────┬──────────────────────┘
                             │ Verified JWT
┌────────────────────────────▼────────────────────────────────────────┐
│                  FastAPI Backend (Cloud Run)                          │
│   ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌───────────────┐   │
│   │  /cases  │  │/evidence │  │ /analysis  │  │   /auth       │   │
│   └──────────┘  └──────────┘  └────────────┘  └───────────────┘   │
│         │              │             │                               │
│   ┌─────▼──────────────▼────────────▼────────────────────────┐     │
│   │     AI Engine (ai_engine.py)                               │     │
│   │   ELA • Deepfake • Log Analysis • Gemini • PDF            │     │
│   └───────────────────────────────────────────────────────────┘     │
│         │                                                            │
│   ┌─────▼──────────┐    ┌────────────────┐                          │
│   │  SQLite (WAL)  │    │  Google Gemini │                          │
│   │  + SQLAlchemy  │    │  2.0 Flash API │                          │
│   └────────────────┘    └────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** 20+ and npm
- **Python** 3.11+
- **Firebase CLI** — `npm install -g firebase-tools`
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Clone & Run Frontend

```bash
git clone https://github.com/Charan291005/NEXUS-DFI.git
cd NEXUS-DFI

npm install
npm run dev
```
**Open:** http://localhost:5173

### 2. Run Backend

```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Create .env file
echo GEMINI_API_KEY=your_key_here > .env

# Seed sample data (optional)
python seed.py

# Start FastAPI server
python -m uvicorn backend.main:app --reload --port 8000
```
**API Docs:** http://localhost:8000/api/docs

### 3. Or Use Docker Compose

```bash
# Full stack with one command
docker-compose up --build
```
- Frontend: http://localhost:80
- Backend: http://localhost:8000

---

## 🔐 Authentication Flow

```
User clicks "Continue with Google"
        │
        ▼
Firebase Google OAuth (popup)
        │
        ▼
Firebase ID Token (JWT) issued
        │
        ▼
Frontend stores token in localStorage
        │
        ▼
Every API request: Authorization: Bearer <token>
        │
        ▼
FastAPI verifies token with Firebase Admin SDK
        │
        ▼
First login → auto-provision user in SQLite DB
        │
        ▼
API response returned ✅
```

**No manual registration required.** Any valid Google account can access the platform.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# ─── Backend (Required) ────────────────────────────────────
GEMINI_API_KEY=your_google_gemini_api_key_here

# ─── Backend (Optional) ────────────────────────────────────
# Path to Firebase service account JSON (not needed on Cloud Run)
# GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# ─── Frontend (Optional) ───────────────────────────────────
# Override the backend API URL for local development
# Defaults to Cloud Run URL in production builds
VITE_API_URL=http://localhost:8000
```

> **Get your Gemini API Key:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) — free tier available

---

## 🚀 Deployment

### Frontend → Firebase Hosting

```bash
# Build production bundle (TypeScript + Vite)
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting --project nexusdfi
```

🌐 **Live at:** https://nexusdfi.web.app

### Backend → Google Cloud Run

```bash
# Submit Docker build to Cloud Build
gcloud builds submit --tag gcr.io/nexusdfi/backend

# Deploy to Cloud Run (serverless, auto-scale to zero)
gcloud run deploy nexusdfi-backend \
  --image gcr.io/nexusdfi/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key_here \
  --memory 512Mi \
  --timeout 60
```

🔧 **API live at:** https://nexusdfi-backend-741401327113.us-central1.run.app

---

## 📁 Project Structure

```
NEXUS-DFI/
├── 📂 src/                         # React + TypeScript frontend
│   ├── 📂 pages/                   # 8 application pages
│   │   ├── LoginPage.tsx           # Split-panel cinematic login
│   │   ├── Dashboard.tsx           # Stats, charts, live activity feed
│   │   ├── CaseList.tsx            # Case CRUD with search & filters
│   │   ├── CaseDetail.tsx          # Case view with evidence & analysis
│   │   ├── EvidencePage.tsx        # Drag-drop upload + AI analysis
│   │   ├── TimelinePage.tsx        # Chronological event reconstruction
│   │   ├── ReportsPage.tsx         # PDF forensic report generator
│   │   └── AssistantPage.tsx       # Gemini AI chat assistant
│   ├── 📂 components/
│   │   ├── Layout.tsx              # Sidebar + animated header shell
│   │   └── ui.tsx                  # StatCard, Badge, Spinner, RiskMeter
│   ├── 📂 context/
│   │   └── AuthContext.tsx         # Firebase auth state & user management
│   ├── 📂 utils/
│   │   ├── api.ts                  # Axios client + JWT interceptors
│   │   └── helpers.ts              # formatDate, riskColor, generateCaseId
│   ├── firebase.ts                 # Firebase app initialization
│   ├── types.ts                    # TypeScript interfaces & enums
│   └── index.css                   # Tailwind v4 + custom design tokens
│
├── 📂 backend/                     # FastAPI Python backend
│   ├── 📂 routers/
│   │   ├── auth.py                 # Firebase token verification + provisioning
│   │   ├── cases.py                # Case CRUD + dashboard stats + activity feed
│   │   ├── evidence.py             # File upload, SHA-256 hash, MIME detection
│   │   └── analysis.py             # ELA, deepfake, log analysis, Gemini, PDF
│   ├── ai_engine.py                # Core forensic algorithms + Gemini API
│   ├── models.py                   # SQLAlchemy ORM models
│   ├── schemas.py                  # Pydantic request/response schemas
│   ├── database.py                 # SQLite + WAL mode configuration
│   └── main.py                     # FastAPI app entry + CORS middleware
│
├── Dockerfile.backend              # Cloud Run optimized Docker image
├── Dockerfile.frontend             # Nginx SPA Docker image
├── docker-compose.yml              # Local full-stack development
├── firebase.json                   # Firebase Hosting + SPA rewrites
├── nginx.conf                      # Production Nginx config
├── seed.py                         # Idempotent database seeding script
└── .env.example                    # Environment variable template
```

---

## 🎨 Design System

NexusDFI uses a custom design system built on **Tailwind CSS v4** with tokens inspired by enterprise security tools.

| Token | Value | Usage |
|-------|-------|-------|
| **Primary Orange** | `#F05A28` | Buttons, active states, key metrics |
| **Electric Teal** | `#00D4AA` | Status indicators, secondary actions |
| **Deep Navy BG** | `#070B14` | Page backgrounds |
| **Card Surface** | `rgba(14,22,40,0.92)` | Glassmorphism cards |
| **Body Font** | Inter | Text content |
| **Display Font** | Outfit | Headings, labels |
| **Mono Font** | JetBrains Mono | Code, IDs, timestamps |

**Design features:**
- 🌙 Dark-first with layered radial gradient backgrounds
- 🔮 Glassmorphism cards with `backdrop-filter: blur(14px)`
- ✨ Framer Motion page transitions + stagger reveals
- 💫 Animated counters, risk meters, hex-grid overlay
- 📱 Collapsible sidebar with scan-line animation

---

## 🐛 Troubleshooting / FAQ

<details>
<summary><b>🔑 Login with Google doesn't work</b></summary>

1. Ensure the Firebase project `nexusdfi` has **Google Sign-In** enabled in the Firebase Console → Authentication → Sign-in providers
2. Check browser console for CORS or auth errors
3. Verify the `authDomain` in `src/firebase.ts` matches your Firebase project

</details>

<details>
<summary><b>📑 PDF report generation fails</b></summary>

PDF generation requires the **FastAPI backend** to be running. Either:
- Start locally: `python -m uvicorn backend.main:app --port 8000`  
- Or the Cloud Run backend URL is accessible (check CORS settings in `backend/main.py`)

</details>

<details>
<summary><b>📊 Activity feed is empty on dashboard</b></summary>

The activity feed shows real events (case creations, evidence uploads, analysis runs). You need at least **one case** with some activity. Create a case via Cases → New Case, then upload evidence to see activity.

</details>

<details>
<summary><b>🌐 CORS errors in development</b></summary>

Ensure your frontend dev server runs on `http://localhost:5173` (Vite default). The backend CORS whitelist includes this origin. If you changed the port, add it to the `ALLOWED_ORIGINS` list in `backend/main.py`.

</details>

<details>
<summary><b>🤖 AI Assistant gives no response</b></summary>

The AI Assistant requires a valid `GEMINI_API_KEY` in your `.env` file. Get one free at [Google AI Studio](https://aistudio.google.com/app/apikey). The backend reads this key at startup.

</details>

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

<div align="center">

**Built with ❤️ by [Shree Charan N](https://github.com/Charan291005)**

*NexusDFI v3.0.0 — Forensics Intelligence Platform*

*Designed for placements, hackathons, and real-world forensic research*

<br/>

[⬆ Back to Top](#-nexusdfi)

</div>
