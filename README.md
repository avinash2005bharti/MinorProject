# CSE Department AI Agentic ERP — Production Backend

A production-ready enterprise backend dedicated exclusively to the **Computer Science & Engineering (CSE) Department**. Powered by a Node.js Express API Gateway, a Python FastAPI Multi-Agent Microservice with Groq LLM, Qdrant Hybrid RAG, normalized **PostgreSQL** relational records (designed for Render PostgreSQL), and MongoDB AI Memory.

---

## 🏛️ Department Structure (Exclusively CSE)

This ERP is tailored specifically for the Computer Science & Engineering department without generic multi-department overhead:
- **1st Year**: Semester 1, Semester 2 (Sections A, B)
- **2nd Year**: Semester 3, Semester 4 (Sections A, B)
- **3rd Year**: Semester 5, Semester 6 (Sections A, B)
- **4th Year**: Semester 7, Semester 8 (Sections A, B)

---

## 🚀 Tech Stack

- **API Gateway:** Node.js + Express (Port 5000)
- **AI Microservice:** Python 3.10 + FastAPI (Port 8000)
- **Authentication:** JWT (Access & Refresh Tokens, bcrypt, Role-based Access Control)
- **Relational DB:** PostgreSQL 16 (`pg`, Sequelize ORM, transactional migration engine, with SQLite dev fallback)
- **AI Memory DB:** MongoDB 7.0 (Long-term facts, conversations, short-term memory, rolling summaries)
- **Vector Database:** Qdrant (dense vector search with Cosine similarity)
- **LLM Engine:** Groq SDK (`llama-3.3-70b-versatile`) with exponential backoff & token tracking
- **Email Service:** Brevo (OTP verification, attendance alerts `<75%`, assignment reminders)
- **File Upload Pipeline:** Multer (PDF, DOCX, PPT, Images -> Extract -> Chunk -> Embed -> Qdrant -> PostgreSQL)
- **Logging:** Winston (`api.log`, `error.log`, `ai.log`, `email.log`)
- **API Docs:** Interactive Swagger UI at `http://localhost:5000/api-docs`
- **Cloud Deployment:** Render Blueprint (`render.yaml`)

---

## 📂 Directory Layout

```
MinorProject/
│
├── backend/                       # Node.js Express API Gateway
│   ├── src/
│   │   ├── config/                # PostgreSQL (pg / Sequelize connection pool), MongoDB, Swagger
│   │   ├── controllers/           # Auth, Students, Faculty, Attendance, Timetable, AI, Leaves
│   │   ├── middleware/            # JWT Auth, RBAC, Multer upload, Winston request logger, Error handler
│   │   ├── migrations/            # 001_initial_postgresql_schema.sql & transactional migrate.js runner
│   │   ├── models/
│   │   │   ├── postgres/          # Normalized Sequelize PostgreSQL models
│   │   │   └── mongo/             # AI Memory schemas (users_memory, conversations, agent_logs)
│   │   ├── routes/                # Modular Express routers
│   │   ├── services/              # Brevo email service, Winston logger
│   │   ├── utils/                 # Automatic CSE database seeder
│   │   └── server.js              # Server entrypoint
│   ├── tests/                     # Automated ERP backend test suite
│   ├── uploads/                   # Uploaded academic materials (PDF, DOCX, PPT)
│   ├── logs/                      # Winston logs (api.log, error.log, ai.log, email.log)
│   ├── .env                       # Backend environment configuration
│   └── package.json
│
├── ai-service/                    # Python FastAPI AI Microservice
│   ├── agents/                    # Specialized AI Agents (Timetable, Student, Faculty, Admin, Memory, RAG)
│   ├── scheduler/                 # Absence scheduler & dynamic substitution adjuster
│   ├── tools/                     # Direct PostgreSQL query tools (psycopg2) & Brevo email tools
│   ├── rag/                       # Qdrant manager, text extraction, chunking
│   ├── memory/                    # MongoDB motor/pymongo memory manager
│   ├── llm/                       # Official Groq SDK wrapper with retries & streaming
│   ├── main.py                    # FastAPI server entrypoint
│   ├── requirements.txt
│   └── .env
│
├── frontend/                      # React + Vite Web Application
├── docker/                        # Dockerfiles for backend and ai-service
├── docs/                          # Architecture blueprints & cloud deployment guides
├── render.yaml                    # Render Blueprint specification for one-click deployment
├── docker-compose.yml             # Orchestrates node, python, postgres, mongodb, qdrant
└── README.md
```

---

## ⚡ Quick Start

### Option 1: Native Local Development (Zero Docker Required)

#### 1. Setup & Run Database Migrations (Backend)
```bash
cd backend
npm install
npm run migrate
npm run seed
npm start
```
*The backend connects to PostgreSQL (or dev SQLite fallback), tracks applied migrations, seeds test data, and runs on `http://localhost:5000`.*
*Interactive Swagger documentation is live at `http://localhost:5000/api-docs`.*

#### 2. Start Python AI Microservice
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```
*The AI service connects to PostgreSQL and Qdrant, exposing endpoints on `http://127.0.0.1:8000`.*

#### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

### Option 2: Docker Compose (Full Stack)

To run the complete system including PostgreSQL 16, MongoDB 7.0, Qdrant, Node.js backend, Python AI service, and React frontend:

```bash
docker compose up -d --build
```

---

### Option 3: Production Deployment on Render

1. Create a Render Blueprint instance pointing to this repository.
2. Render uses [`render.yaml`](./render.yaml) to automatically provision:
   - **PostgreSQL 16** managed database (`cse-erp-postgres`)
   - **Node.js Express Backend** (`cse-erp-backend`) with safe automatic migrations (`npm run migrate && npm start`)
   - **Python FastAPI Microservice** (`cse-erp-ai-service`) with timetable generation and LLM reasoning
   - **React Frontend** (`cse-erp-frontend`) static site
3. Input your sensitive environment keys in the Render Dashboard (`GROQ_API_KEY`, `MONGODB_URI`, `QDRANT_API_KEY`).

---

## 🔑 Seed Test Accounts

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@college.edu` | `admin123` | CSE Department Administrator |
| **Faculty (HOD)** | `hod.cse@college.edu` | `password123` | Dr. Alok Verma (Professor & HOD, AI & ML) |
| **Faculty (Teacher)**| `sunita.sharma@college.edu` | `password123` | Dr. Sunita Sharma (Associate Professor, DBMS) |
| **Student** | `ayush.student@college.edu` | `password123` | Ayush Sharma (3rd Year, Semester 5, Section A) |

---

## 📡 Key API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/login`: Authenticate and receive Access & Refresh JWT tokens
- `POST /api/auth/register`: Register new student or faculty profile
- `POST /api/auth/refresh`: Refresh expired JWT access token
- `POST /api/auth/forgot-password`: Send 6-digit OTP via Brevo email
- `POST /api/auth/verify-otp`: Verify OTP code and reset password

### 🎓 Academic CSE Hierarchy (`/api/academic`)
- `GET /api/academic/hierarchy`: Returns complete 4-Year, 8-Semester, and Section A/B hierarchy
- `GET /api/academic/subjects`: List core CSE subjects by semester
- `GET /api/academic/sections`: List sections by year and semester

### 📊 Attendance (`/api/attendance`)
- `POST /api/attendance/mark`: Mark single student attendance
- `POST /api/attendance/bulk`: Roll call for an entire class lecture
- `GET /api/attendance/stats`: Student percentage and subject-wise breakdown (auto-triggers alert if `<75%`)

### 📅 Timetable (`/api/timetable`)
- `GET /api/timetable`: Query schedule by Year, Semester, Section, and Day
- `GET /api/timetable/my`: Personalized schedule for logged-in user
- `POST /api/timetable/generate`: Autonomous AI timetable generation with constraint validation
- `POST /api/timetable/adjust-absence`: Dynamic substitution adjustment for absent teachers
- `GET /api/timetable/export/pdf`: Download timetable PDF
- `GET /api/timetable/export/excel`: Download timetable Excel

### 🤖 AI Multi-Agent Core (`/api/ai`)
- `POST /api/ai/chat`: Central agent orchestrator (Node ↔ Python FastAPI ↔ Groq LLM ↔ Qdrant RAG ↔ MongoDB Memory ↔ PostgreSQL)
- `GET /api/ai/suggestions`: Contextual prompts tailored for student, faculty, or admin
- `POST /api/ai/rag/search`: Hybrid search across Qdrant vector collections
