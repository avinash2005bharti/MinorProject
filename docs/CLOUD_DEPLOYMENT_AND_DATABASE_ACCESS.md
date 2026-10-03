# ☁️ Cloud Deployment & Direct Database Access Guide
## CSE Department Agentic ERP System

This guide outlines how to host the system on cloud services (Render, Docker VPS, AWS) and connect directly to the relational and document databases using **pgAdmin / DBeaver / psql** and **MongoDB Compass**.

---

## 1. 🐘 Connecting to PostgreSQL via pgAdmin, DBeaver, or psql

PostgreSQL is the **authoritative source of truth** for all academic and ERP relational records:
* Students, Faculty, HODs, and Departments
* Subjects, Classes, and Classrooms
* Timetables, Scheduling Constraints, and Teacher Availability
* Attendance, Leave Requests, and Attendance Correction Queries

---

### A. If using Render Managed PostgreSQL
Render provides an **Internal Connection String** (for backend services deployed within Render) and an **External Connection String** (for direct connections from your laptop via pgAdmin, DBeaver, or `psql`).

| Parameter | Setting |
| :--- | :--- |
| **Connection Name** | `Render PostgreSQL Production` |
| **Host** | Found in Render Dashboard (`dpg-xxxxxx-a.oregon-postgres.render.com`) |
| **Port** | `5432` |
| **Database** | `cse_erp` (or database name assigned by Render) |
| **Username** | `cse_user` (or assigned user) |
| **Password** | Found in Render Dashboard |
| **SSL Mode** | `Require` (SSL enabled is mandatory on Render) |

#### Quick Connect via `psql` CLI:
```bash
psql "postgresql://cse_user:<PASSWORD>@dpg-xxxxxx-a.oregon-postgres.render.com:5432/cse_erp?sslmode=require"
```

#### Connecting with pgAdmin:
1. Open **pgAdmin 4** -> Right-click **Servers** -> **Register** -> **Server...**.
2. **General tab**: Enter Name (e.g. `Render CSE ERP`).
3. **Connection tab**:
   - Host name/address: `dpg-xxxxxx-a.oregon-postgres.render.com`
   - Port: `5432`
   - Maintenance database: `cse_erp`
   - Username: `cse_user`
   - Password: Paste Render password (check *Save password*).
4. **Parameters / SSL tab**:
   - SSL mode: `Require`.
5. Click **Save**.

#### Connecting with DBeaver:
1. Open **DBeaver** -> Click **New Database Connection** -> Select **PostgreSQL**.
2. Enter Host, Port (`5432`), Database name, Username, and Password.
3. Switch to the **SSL** tab -> Check **Use SSL** -> SSL mode: `require`.
4. Click **Test Connection ...** -> Once verified, click **Finish**.

---

### B. If using Docker on a Cloud VPS / Local Development
When using the included [`docker-compose.yml`](../docker-compose.yml):

| Parameter | Setting |
| :--- | :--- |
| **Hostname** | `localhost` (local) or VPS Public IP Address (e.g. `203.0.113.25`) |
| **Port** | `5432` |
| **Database** | `cse_erp` |
| **Username** | `cse_user` |
| **Password** | `cse_password123` |
| **SSL Mode** | `Disable` or `Allow` |

---

### Step-by-Step SQL Verification:
Run queries across the normalized tables:
```sql
-- View all tables
\dt

-- Check students, faculty, and timetable
SELECT * FROM students LIMIT 10;
SELECT * FROM faculty;
SELECT * FROM timetables WHERE section = 'A';
SELECT * FROM leave_requests;
SELECT * FROM attendance_queries;
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 2. 🍃 Connecting to MongoDB via MongoDB Compass

MongoDB stores **Conversational Short-Term Memory (STM)**, **AI Agent Logs**, **Tool Execution Logs**, and **User Preferences**.

### Connection String (URI)

#### A. If using Cloud MongoDB Atlas
1. Open **MongoDB Compass**.
2. In the *New Connection* box, paste your MongoDB Atlas Connection String:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/cse_erp?retryWrites=true&w=majority
   ```
3. Click **Connect**.

#### B. If using Docker on a Cloud VPS
```text
mongodb://<YOUR_VPS_PUBLIC_IP>:27017/cse_erp
```
*(If authentication is enabled, use `mongodb://<user>:<password>@<YOUR_VPS_PUBLIC_IP>:27017/cse_erp`)*

### Collections Visible in MongoDB Compass:
- `conversations`: Chronological message records with role, sender, citations, and tool call traces.
- `users_memory`: Long-term fact extractions and student academic profiles.
- `short_term_memory`: Recent context windows used for LLM prompt construction.
- `agent_logs`: Observability logs for autonomous Agent activities.
- `tool_execution_logs`: Audit trail for tool executions (SQL tools, timetable generators, absence adjusters).

---

## 3. 🚀 Cloud Deployment Options

### Option 1: Render Blueprint Deployment (Recommended for Production)
The repository includes a ready-to-use [`render.yaml`](../render.yaml) specification:

1. Connect your GitHub repository to [Render](https://dashboard.render.com).
2. Go to **Blueprints** -> Click **New Blueprint Instance**.
3. Select your repository (`MinorProject`).
4. Render will automatically configure:
   - **PostgreSQL Database** (`cse-erp-postgres`)
   - **Node.js Backend** (`cse-erp-backend`) with `npm run migrate && npm start`
   - **Python AI Microservice** (`cse-erp-ai-service`) with `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **React Frontend** (`cse-erp-frontend`) static site
5. Fill in the sensitive environment variables (such as `GROQ_API_KEY`, `MONGODB_URI`, `QDRANT_API_KEY`).
6. Click **Apply** to launch the deployment.

---

### Option 2: Full-Stack Docker Compose on Cloud VPS
Deploy all services on any Linux VPS (AWS EC2 Ubuntu, DigitalOcean Droplet, Linode, GCP Compute Engine):

1. **Clone the repository on the cloud server:**
   ```bash
   git clone https://github.com/avinash2005bharti/MinorProject.git /opt/MinorProject
   cd /opt/MinorProject
   ```
2. **Configure your `.env`:**
   ```bash
   cp .env.example .env
   nano .env
   ```
   Add your `GROQ_API_KEY`, `DATABASE_URL`, and credentials.
3. **Launch all services in background:**
   ```bash
   docker compose up -d --build
   ```
4. **Access your services:**
   - Web App UI: `http://<YOUR_SERVER_IP>` (Port 80)
   - Node API Gateway: `http://<YOUR_SERVER_IP>:5000/api`
   - Interactive Swagger Docs: `http://<YOUR_SERVER_IP>:5000/api-docs`
   - Python AI Microservice: `http://<YOUR_SERVER_IP>:8000/docs`
   - PostgreSQL (pgAdmin/psql): `<YOUR_SERVER_IP>:5432`
   - MongoDB (Compass): `mongodb://<YOUR_SERVER_IP>:27017/cse_erp`

---

## 4. 🔒 Cloud Database Security & Firewall Tips
1. **Render PostgreSQL:**
   - Render internal connections within the same region are encrypted and bypass public routing.
   - For external connections (e.g., pgAdmin from your workstation), Render requires SSL (`sslmode=require`).
2. **MongoDB Compass (Atlas):**
   - In MongoDB Atlas, go to **Network Access** -> **IP Access List**.
   - Add your current IP (or configure trusted VPC peering / Render IP ranges).
