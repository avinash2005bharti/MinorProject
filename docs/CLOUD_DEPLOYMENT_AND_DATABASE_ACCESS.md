# ☁️ Cloud Deployment & Direct Database Access Guide
## CSE Department Agentic ERP System

This guide outlines how to host the system on cloud services and connect directly to the relational and document databases using **MySQL Workbench** and **MongoDB Compass**.

---

## 1. 🗄️ Connecting to MySQL via MySQL Workbench

MySQL is the **authoritative source of truth** for all academic records (Students, Faculty, Subjects, Classrooms, Sections, Timetables, Attendance, Assignments, Substitutions, Notes, Notices, and Requests).

### Connection Parameters

#### A. If using Cloud MySQL (AWS RDS / Railway / Aiven / DigitalOcean)
| Parameter | Setting |
| :--- | :--- |
| **Connection Name** | `CSE ERP Cloud Production` |
| **Connection Method** | `Standard (TCP/IP)` |
| **Hostname** | Your Cloud Host (e.g. `cse-db.cxxxxxx.us-east-1.rds.amazonaws.com` or `roundhouse.proxy.rlwy.net`) |
| **Port** | `3306` (or Railway external port, e.g. `45678`) |
| **Username** | `root` or `admin` or your assigned cloud DB username |
| **Password** | Click **Store in Vault ...** and enter your password |
| **Default Schema** | `cse_erp` |
| **SSL Tab** | Set **Use SSL** to `Require` (or `Require and Verify CA` if using AWS RDS CA) |

#### B. If using Docker on a Cloud VPS (AWS EC2 / DigitalOcean Droplet / Linode)
When using the included [`docker-compose.yml`](../docker-compose.yml):
| Parameter | Setting |
| :--- | :--- |
| **Hostname** | Your VPS Public IP Address (e.g. `203.0.113.25`) |
| **Port** | `3306` |
| **Username** | `root` (or `cse_user`) |
| **Password** | `rootpassword123` (or `cse_password123`) |
| **Default Schema** | `cse_erp` |

### Step-by-Step in MySQL Workbench:
1. Open **MySQL Workbench**.
2. Click the **`+`** icon next to *MySQL Connections*.
3. Enter the Hostname, Port, Username, and Default Schema from above.
4. Click **Test Connection** — ensure the test reports *"Successfully made the MySQL connection"*.
5. Click **OK** to save and open the SQL Query Editor.
6. Run queries across normalized tables:
   ```sql
   USE cse_erp;
   SHOW TABLES;
   SELECT * FROM students;
   SELECT * FROM faculty;
   SELECT * FROM timetable WHERE section = 'A';
   SELECT * FROM student_requests;
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

### Option 1: Full-Stack Docker Compose on Cloud VPS (Fastest & Simplest)
Deploy all 6 services on any Linux VPS (AWS EC2 Ubuntu, DigitalOcean Droplet, Linode, GCP Compute Engine):

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
   Add your `GROQ_API_KEY` and credentials.
3. **Launch all services in background:**
   ```bash
   docker compose up -d --build
   ```
4. **Access your services:**
   - Web App UI: `http://<YOUR_SERVER_IP>` (Port 80)
   - Node API Gateway: `http://<YOUR_SERVER_IP>:5000/api`
   - Interactive Swagger Docs: `http://<YOUR_SERVER_IP>:5000/api-docs`
   - Python AI Microservice: `http://<YOUR_SERVER_IP>:8000/docs`
   - MySQL (Workbench): `<YOUR_SERVER_IP>:3306`
   - MongoDB (Compass): `mongodb://<YOUR_SERVER_IP>:27017/cse_erp`

---

### Option 2: Managed Cloud Platforms (Serverless / Microservices)

#### Frontend on Vercel or Netlify:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** `frontend`
- **Environment Variables:**
  - `VITE_API_URL`: `https://api.yourcloud.com` (Your cloud backend URL)

#### Backend on Render, Railway, or AWS ECS:
- **Root Directory:** `backend`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `NODE_ENV=production`
  - `PORT=5000`
  - `MYSQL_DATABASE_URL=mysql://<user>:<pass>@<rds_host>:3306/cse_erp`
  - `MYSQL_SSL=true`
  - `MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/cse_erp`
  - `PYTHON_AI_SERVICE_URL=https://ai-service.yourcloud.com`
  - `CLIENT_URL=https://your-frontend.vercel.app`
  - `CORS_ORIGIN=*`

#### AI Microservice on Railway, Render, or AWS App Runner:
- **Root Directory:** `ai-service`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 8000`
- **Environment Variables:**
  - `LLM_PROVIDER=groq`
  - `GROQ_API_KEY=gsk_...`
  - `MYSQL_DATABASE_URL=mysql://<user>:<pass>@<rds_host>:3306/cse_erp`
  - `MYSQL_SSL=true`
  - `MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/cse_erp`
  - `QDRANT_URL=https://xxxx.cloud.qdrant.io:6333`
  - `QDRANT_API_KEY=...`

---

## 4. 🔒 Cloud Database Security & Firewall Tips
1. **MySQL Workbench (AWS RDS):**
   - Ensure the AWS Security Group for your RDS instance has an inbound rule for TCP Port `3306` from your IP address or VPS IP.
   - Set **Publicly Accessible: Yes** if connecting directly from your local laptop's MySQL Workbench.
2. **MongoDB Compass (Atlas):**
   - In MongoDB Atlas, go to **Network Access** -> **IP Access List**.
   - Add your current IP (or `0.0.0.0/0` with secure strong passwords for unrestricted cloud access).
