# Multi-Tenant SaaS CRM — Production Deployment Guide

## Quick Start via Docker Compose

Run the entire multi-container production stack (PostgreSQL, Redis, Backend API, Frontend Nginx) with a single command:

```bash
docker-compose up -d --build
```

### Stack Components

| Service | Internal Host | Port | Health Check |
|---|---|---|---|
| **PostgreSQL** | `postgres` | 5432 | `pg_isready -U crm_user -d crm_db` |
| **Redis** | `redis` | 6379 | `redis-cli ping` |
| **Backend API** | `backend` | 5000 | `GET /health` |
| **Frontend UI** | `frontend` | 5173 (host) / 80 (container) | Static Nginx HTML |

---

## Local Development Commands

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run seed
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Run Automated Integration Tests
```bash
cd backend
npm test
```

### 4. Build Production Frontend Bundle
```bash
cd frontend
npm run build
```
