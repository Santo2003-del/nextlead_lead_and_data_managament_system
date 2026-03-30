# NexLead — SaaS Lead Intelligence Platform

A production-grade lead intelligence platform with web scraping, Elasticsearch, and background job queues. Built with the MERN stack (MongoDB, Express, React, Node.js).

---

## Architecture Overview

```text
┌────────────────────────────────────────────────────────┐
│  Frontend: React + Vite + MUI Dark Theme (port 3000)   │
├────────────────────────────────────────────────────────┤
│  API Server    │  Scrape Worker  │ Export Worker       │
│  Node/Express  │  Playwright     │ CSV/Excel           │
│  port 5055     │                 │                     │
├────────────────┴─────────────────┴─────────────────────┤
│  MongoDB Atlas  │  In-Memory Queues │  Elasticsearch 8 │
└────────────────────────────────────────────────────────┘
```

> **Note**: Background workers currently use In-Memory queues, removing the dependency on Redis.

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- MongoDB Atlas (connected via `.env`)
- Elasticsearch 8+ (Optional but recommended for full-text search)

### 1. Backend Setup
```bash
cd backend
npm install

# Make sure .env has your MongoDB URI and port 5055
# Generate a random string for JWT_SECRET and JWT_REFRESH_SECRET

# Create initial admin user
npm run seed  
```

### 2. Start Backend & Workers
Open separate terminal tabs:
```bash
cd backend
npm run dev            # API Server (Port 5055)
npm run worker:scrape  # Scraper Worker
npm run worker:export  # Export Worker
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Make sure you have a .env file with VITE_APP_API_URL=/api
npm run dev            # Vite Dev Server (Port 3000, proxying to 5055)
```

### Default Credentials
- **Email:** `admin@nexlead.io`
- **Password:** `NextLeadgmv@2026` *(Change immediately in production!)*

---

## 🚀 Live Production Deployment (VPS)

The project is configured for dual-environment support. In production, the backend serves the compiled frontend.

### 1. Server Prerequisites (Ubuntu 22.04)
```bash
sudo apt update
sudo apt install -y nodejs npm nginx git certbot python3-certbot-nginx
sudo npm install -g pm2
```

### 2. Project Setup
```bash
git clone <your-repo> /opt/nexlead
cd /opt/nexlead

# Install backend dependencies
cd backend
npm install

# Setup backend .env (ensure NODE_ENV=production, PORT=5055)
nano .env

# Install and build frontend
cd ../frontend
npm install
npm run build
# (The build will output to frontend/build, which the backend will serve)
```

### 3. PM2 Process Management
We use PM2 to manage the backend API and worker processes using the provided `ecosystem.config.js`.

```bash
cd /opt/nexlead/backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. Nginx Reverse Proxy & SSL
A pre-configured `nginx.conf` is provided in the root directory.

```bash
# Copy config
sudo cp /opt/nexlead/nginx.conf /etc/nginx/sites-available/nexlead
sudo ln -s /etc/nginx/sites-available/nexlead /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL
sudo certbot --nginx -d serantix.com -d www.serantix.com
```

---

## Environment Variables Reference

| Variable | Location | Description |
|----------|----------|-------------|
| `PORT` | Backend | Port for API server (Default: `5055`) |
| `NODE_ENV` | Backend | `development` or `production` |
| `DB_CONNECTION_URL` | Backend | MongoDB Atlas URI |
| `JWT_SECRET` | Backend | Strong, random 64+ char string |
| `ELASTIC_URL` | Backend | ES URL (Default: `http://localhost:9200`) |
| `CORS_ORIGIN` | Backend | Allowed domains (e.g., `https://serantix.com`) |
| `VITE_APP_API_URL` | Frontend | `/api` (local) or `https://domain.com/api` (live) |

---

## Core Features
1. **Lead Scraping**: Playwright-based background scraping queues.
2. **Data Export**: Background generation of large CSV/Excel files.
3. **Elasticsearch**: High-performance full-text search with fuzzy matching.
4. **RBAC**: Multi-tier role-based access control (Super Admin, Admin, Manager, Marketing, Employee).
