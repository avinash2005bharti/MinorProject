# CSE Department AI Agentic ERP — Production Backend

A production-ready enterprise backend dedicated exclusively to the **Computer Science & Engineering (CSE) Department**. Powered by a Node.js Express API Gateway, a Python FastAPI Multi-Agent Microservice with Groq LLM, Qdrant Hybrid RAG, normalized MySQL records, and MongoDB AI Memory.

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
- **Relational DB:** MySQL 8.0 with Sequelize ORM (with seamless SQLite dev fallback)
- **AI Memory DB:** MongoDB 7.0 (Long-term facts, conversations, short-term memory, rolling summaries)
- **Vector Database:** Pinecone (768-dimensional dense vectors with Cosine similarity)
- **LLM Engine:** Groq SDK (`llama-3.3-70b-versatile`) with exponential backoff & token tracking
- **Email Service:** Brevo (OTP verification, attendance alerts `<75%`, assignment reminders)
- **File Upload Pipeline:** Multer (PDF, DOCX, PPT, Images -> Extract -> Chunk -> Embed 768-dim -> Pinecone -> MySQL)
- **Logging:** Winston (`api.log`, `error.log`, `ai.log`, `email.log`)
- **API Docs:** Interactive Swagger UI at `http://localhost:5000/api-docs`

---

## 📂 Directory Layout

```
MinorProject/
│
├── backend/                       # Node.js Express API Gateway
│   ├── src/
│   │   ├── config/                # MySQL (Sequelize), MongoDB, Swagger
│   │   ├── controllers/           # Auth, Students, Faculty, Attendance, Assignments, Timetable, Notes, AI
│   │   ├── middleware/            # JWT Auth, RBAC, Multer upload, Winston request logger, Error handler
│   │   ├── models/
│   │   │   ├── mysql/             # Normalized Sequelize tables
│   │   │   └── mongo/             # AI Memory schemas (users_memory, conversations, agent_logs)
│   │   ├── routes/                # Modular Express routers
│   │   ├── services/              # Brevo email service, Winston logger
│   │   ├── utils/                 # Automatic CSE database seeder
│   │   └── server.js              # Server entrypoint
│   ├── uploads/                   # Uploaded academic materials (PDF, DOCX, PPT)
│   ├── logs/                      # Winston logs (api.log, error.log, ai.log, email.log)
│   ├── .env                       # Backend environment configuration
│   └── package.json
│
├── ai-service/                    # Python FastAPI AI Microservice
│   ├── agents/                    # Specialized AI Agents
│   │   ├── student_assistant.py   # Timetable, Attendance, Assignments, Office hours
│   │   ├── faculty_assistant.py   # Assignment generator, Submission summary, Email drafter
│   │   ├── admin_assistant.py     # Workload audits, Attendance compliance, Missing registers
│   │   ├── rag_agent.py           # Multi-collection semantic retriever & citations
│   │   ├── memory_agent.py        # Short-term/long-term memory & rolling summaries
│   │   └── email_agent.py         # Brevo transactional email actions
│   ├── rag/                       # Qdrant manager, text extraction, chunking
│   ├── memory/                    # MongoDB motor/pymongo memory manager
│   ├── tools/                     # Direct MySQL query tools & Brevo email tools
│   ├── embeddings/                # Standardized 384-dim dense vector embedder
│   ├── llm/                       # Official Groq SDK wrapper with retries & streaming
│   ├── main.py                    # FastAPI server entrypoint
│   ├── requirements.txt
│   └── .env
│
├── docker/                        # Dockerfiles for backend and ai-service
├── docs/                          # Architecture blueprints & API documentation
├── docker-compose.yml             # Orchestrates node, python, mysql, mongodb, qdrant
└── README.md
```

---

## ⚡ Quick Start

### Option 1: Native Local Development (Zero Docker Required)

#### 1. Start Node.js Backend Gateway
```bash
cd backend
npm install
npm start
```
*The backend initializes, syncs database tables, creates seed accounts, and runs on `http://localhost:5000`.*
*Interactive Swagger documentation is live at `http://localhost:5000/api-docs`.*

#### 2. Start Python AI Microservice
```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
*The AI service initializes Qdrant collections, connects memory, and runs on `http://127.0.0.1:8000`.*

#### 3. Start Frontend
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

### Option 2: Docker Compose (Full Stack)

To run the complete system including MySQL 8.0, MongoDB 7.0, Qdrant, Node.js, and Python via Docker:

```bash
docker-compose up --build
```

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
- `GET /api/attendance/stats`: Student percentage and subject-wise breakdown (auto-triggers Brevo alert if `<75%`)

### 📝 Assignments (`/api/assignments`)
- `GET /api/assignments`: List assignments by semester or subject
- `POST /api/assignments`: Create assignment with PDF/DOCX attachment
- `POST /api/assignments/submit`: Student submission with file upload
- `PUT /api/assignments/evaluate/:id`: Faculty grading with marks and feedback

### 📅 Timetable (`/api/timetable`)
- `GET /api/timetable`: Query schedule by Year, Semester, Section, and Day
- `GET /api/timetable/my`: Personalized schedule for logged-in student
- `POST /api/timetable`: Create lecture slot

### 📚 Notes & Documents (`/api/notes`)
- `POST /api/notes/upload`: Upload PDF/DOCX/PPT note, save metadata in MySQL, and index into Qdrant collection
- `GET /api/notes`: Filter documents by category (`Notes`, `Assignments`, `Circulars`, `Syllabus`, `Lab Manuals`, `Previous Papers`, `Faculty Documents`)
- `GET /api/notes/download/:id`: Download file

### 🤖 AI Multi-Agent Core (`/api/ai`)
- `POST /api/ai/chat`: Central agent orchestrator (Node ↔ Python FastAPI ↔ Groq LLM ↔ Qdrant RAG ↔ MongoDB Memory)
- `GET /api/ai/suggestions`: Contextual prompts tailored for student, faculty, or admin
- `POST /api/ai/rag/search`: Hybrid search across Qdrant vector collections
- `GET /api/ai/memory`: Retrieve user's long-term memory facts and learning profile
