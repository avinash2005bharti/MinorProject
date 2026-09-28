# CampusFlow – CSE Department ERP (Backend)

Production-ready Express.js, MongoDB, and Socket.IO backend for the Computer Science & Engineering Department ERP.

## 🚀 Key Features

* **Strict Academic Hierarchy**: Dedicated to CSE Department: 4 Years → 8 Semesters → Sections (A, B, C...).
* **Multi-Role Authentication**: Student, Teacher, Mentor (TG), HOD, Administrator with JWT tokens and bcrypt password hashing.
* **Email OTP Password Reset**: Automated reset flow via Nodemailer.
* **Attendance Ledger**: Automated percentage calculation, status badges (Safe / Borderline / Critical), and dynamic QR attendance scanning.
* **AI Multi-Agent Core**:
  * **Attendance Agent**: Recalculates aggregates, propagates institutional duty credits, and dispatches notices.
  * **Leave Agent**: Evaluates mentor (TG) availability telemetry and autonomously triggers direct HOD routing if unavailable.
  * **Timetable Agent**: Heuristic conflict detector for rooms, teachers, and workload intervals with autonomous healing.
  * **Notification Agent**: Cross-role Socket.IO notifications + database persistence.
* **Interactive Swagger UI**: Full OpenAPI 3.0 documentation at `/api-docs`.
* **File Uploads**: Secure document uploads with Multer for medical certificates, OD letters, and assignment files.
* **Excel Reports**: Import and export for students and timetables.
* **Audit Trail**: Every significant administrative and clearance action logged in `AuditLog`.

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
Check `.env` (or copy from `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/campusflow
JWT_SECRET=campusflow_super_secret_jwt_key_cse_dept_2025_secure
```
*Note: If local MongoDB is not running, the backend automatically initializes an embedded MongoDB memory server during development.*

### 3. Seed Database
```bash
npm run seed
```

### 4. Start Server
```bash
npm run dev
# or
npm start
```

---

## 🔑 Demo Credentials (Password: `password123`)

* **Admin**: `admin@campusflow.com` / `admin.support@oist.ac.in`
* **HOD**: `hod.cse@campusflow.com` / `s.roy@oist.ac.in`
* **Mentor / TG**: `tg@campusflow.com` / `k.sen@oist.ac.in`
* **Faculty**: `teacher1@campusflow.com` / `r.verma@oist.ac.in`
* **Student**: `student1@campusflow.com` / `21cse084@oist.ac.in`

---

## 📚 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | User login (returns JWT token and profile) |
| `POST` | `/api/auth/forgot-password` | Request password reset OTP |
| `POST` | `/api/auth/reset-password` | Reset password using OTP |
| `GET` | `/api/attendance/student/:id` | Student attendance breakdown & status |
| `POST` | `/api/attendance/bulk` | Teacher session roll call lock |
| `POST` | `/api/attendance/qr/generate` | Generate QR attendance session |
| `POST` | `/api/attendance/qr/scan` | Student QR attendance scan |
| `GET` | `/api/timetable` | Section / Teacher timetable |
| `GET` | `/api/timetable/analyze` | AI Engine constraint check |
| `POST` | `/api/timetable/resolve` | AI autonomous clash resolution |
| `POST` | `/api/requests/attendance/consideration` | Submit duty credit request |
| `POST` | `/api/requests/leave` | Submit leave (auto TG / HOD routing) |
| `POST` | `/api/agents/attendance` | Run Attendance Agent workflow |
| `POST` | `/api/agents/leave` | Run Leave Agent routing check |
| `POST` | `/api/agents/timetable` | Run Timetable Optimization Agent |
| `GET` | `/api/agents/status` | Autonomous multi-agent status |
| `GET` | `/api/cse/years` | CSE 4-year / 8-semester structure |
| `GET` | `/api/dashboard/:role` | Personalized role dashboard feeds |
| `GET` | `/api-docs` | Interactive Swagger API documentation |
