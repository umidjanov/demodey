# QUIZORA 🚀
### AI-Powered Quiz, Learning, Gamification & Social Learning SaaS Platform

> **Learn. Practice. Compete. Improve.**

QUIZORA is a full-stack, enterprise-grade learning and competitive examination platform. Inspired by modern SaaS productivity suites and high-retention edtech platforms, it pairs a four-stage active recall pedagogy with real-time multiplayer arenas, AI-guided tutoring, habit discipline tracking, and competitive tokenomics.

---

## 🌟 Key Highlights

- **4-Stage Quiz Experience:**
  1. *Review Questions* (Pre-assessment priming & notes).
  2. *Educational Video* (Concise, high-yield topic video or conceptual primer).
  3. *Take the Quiz* (Synchronized server-authoritative timer, auto-saving answers).
  4. *Results & Post-Mortem* (Granular question breakdown, AI written answer evaluation, "Ask AI About Mistakes").
- **Kuest-Inspired UI/UX:**
  - 3-column desktop layout (Left navigation, Central interactive workspace, Right social presence).
  - Premium palette: Primary Teal (`#07858B`), Dark Teal (`#066D73`), Soft Background (`#F7F9FC`), Gold Rewards (`#F5B83D`), and lively accent gradients.
- **Robust Gamification & Anti-Cheat:**
  - Strict **+10 Ranking Coins** rule only for 100% correct quizzes.
  - Transparent transaction ledger preventing double-crediting.
  - Dynamic level progression based on XP, streaks, and milestone achievements.
  - End-of-month tournament automated podium awarding + 900 coin "Clever" champion title.
- **Real-Time Multiplayer Rooms:**
  - WebSocket-synchronized lobbies with room codes (`QZ-XXXX`).
  - Concurrent question answering and live ranking boards.
- **AI Tutoring & Written Evaluation:**
  - Deterministic grading for MCQs; AI semantic rubric scoring for open-ended questions.
  - Socratic learning assistant ready to analyze errors and generate targeted practice drills.
- **Discipline & Habit Tracker:**
  - Interactive daily task planner with completion percentage velocity rings.
- **7 Educational Mini-Games:**
  - Fully playable interactive games: Word Puzzle, Vocabulary Challenge, Memory Cards, Math Challenge, True or False, Word Match, and Quick Logic.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, Recharts, TanStack Query |
| **Backend** | Python 3.12+, FastAPI, Pydantic v2, Motor (Async MongoDB), WebSockets, Uvicorn |
| **Database** | MongoDB (30 collections with indexed constraints & validation), Redis (caching & presence) |
| **AI Layer** | Provider-agnostic abstraction (Gemini / OpenAI / Claude) with intelligent heuristic fallback |
| **Security** | Argon2 / bcrypt password hashing, JWT Access & Refresh tokens, Google OAuth 2.0, RBAC |

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 18+ (Node 24 tested)
- Python 3.12+ (Python 3.15 tested)
- MongoDB 6.0+ (Optional: app includes seamless offline development fallback)

### 2. Setup Environment
```bash
cp .env.example .env
```

### 3. Backend Setup (FastAPI)
```bash
cd apps/api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
API Documentation available at: `http://localhost:8000/docs`

### 4. Frontend Setup (Next.js)
```bash
cd apps/web
npm install
npm run dev
```
Open your browser at: `http://localhost:3000`

---

## 🧪 Testing Suite
- Backend: `npm run test:api` (or `pytest` in `apps/api`)
- Frontend: `npm run test:web`
