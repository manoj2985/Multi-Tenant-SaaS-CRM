# Multi-Tenant SaaS CRM (Enterprise Grade)

A complete, production-ready, high-performance **Multi-Tenant SaaS CRM** built using **Pure JavaScript (ES6+)**, Node.js, Express, PostgreSQL, Prisma ORM, BullMQ, Socket.IO, and React (Vite).

---

## 🌟 Key System Features

### 🏢 1. Tenant Isolation & Authentication
- **Multi-Tenancy**: Strict `companyId` scoping across all database queries and middleware. Cross-tenant data leaks are impossible.
- **Authentication**: JWT access and refresh token rotation, bcrypt password hashing, and brute-force lockout protections.
- **RBAC**: Fine-grained role-based access control (`SUPER_ADMIN`, `COMPANY_ADMIN`, `SALES_MANAGER`, `SALES_EXECUTIVE`).
- **Company Controls**: Account suspension/activation and platform admin management console.

### 💼 2. Core CRM Suite
- **Customer Management**: Full CRUD, custom field extensions, and activity tracking.
- **Lead Pipeline**: Lead capture, qualification scoring, and 1-click atomic conversion into Customer + Deal + Follow-up Task.
- **Sales Pipeline Kanban**: Interactive Kanban stage manager (`LEAD`, `CONTACTED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`) with stage probability tracking.
- **Tasks & Meetings**: Kanban Task Board, overlap conflict detection for scheduling, and Customer Activity Timelines.

### 📊 3. Executive Dashboard & Analytics
- **KPI Cards**: Total Customers, Total Leads, Active Deals, Won Deals, Lost Deals, Total Revenue, Conversion Rate, Win Rate, and Average Deal Value.
- **Pipeline Stage Analytics**: Value distribution per pipeline stage.
- **Deal Revenue Time-Series**: Historical sales performance.
- **Sales Leaderboard**: Performance tracking by representative.
- **Global Search**: Multi-entity instantaneous search across Customers, Leads, Deals, Tasks, and Meetings.

### 🔔 4. Real-Time Socket.IO Notifications
- Event-driven real-time notifications for task assignments, deal stage updates, and meeting reminders.
- In-app notification popover bell and user preference settings.

### 💳 5. SaaS Subscription, Storage & Admin Console
- **Subscription Architecture**: Tiered plan limits (`FREE`, `PREMIUM`, `ENTERPRISE`) with limit enforcement middleware and downgrade protection.
- **File Storage**: Attachment uploads linked to CRM entities with streaming downloads and quota tracking.
- **Platform Admin Console**: Multi-tenant management for `SUPER_ADMIN`.

### 🛡️ 6. Production Security & Observability
- **Security**: Helmet HTTP headers, CORS origin restrictions, rate-limiting (`express-rate-limit`), and brute-force IP lockout.
- **Security Utilities**: Single-use password reset flow (`/forgot-password`, `/reset-password`) and session revocation (`logout-all`).
- **Observability**: Pino structured logging with key redaction, `X-Request-ID` propagation, and probes (`/health`, `/ready`, `/metrics`).
- **OpenAPI**: Interactive Swagger UI at `/api-docs`.

### ⚡ 7. Automation, Webhooks & Developer API
- **Workflow Automation Engine**: Reusable triggers (`RECORD_CREATED`, `STATUS_CHANGED`, `DEAL_WON`, etc.), logical condition evaluation, and action execution (`CREATE_TASK`, `SEND_EMAIL`, `WEBHOOK`).
- **Custom Fields Engine**: Dynamic custom field definitions (`TEXT`, `NUMBER`, `BOOLEAN`, `DATE`, `SELECT`).
- **Tag Taxonomy**: Organization-wide color-coded tagging for CRM records.
- **Advanced Search**: Parameterized search query builder (`POST /api/search/advanced`).
- **CSV Data Import/Export**: CSV preview validator, BullMQ batch importer, and exporter.
- **Outbound Webhooks**: HMAC-SHA256 signed webhooks (`X-CRM-Signature`).
- **Developer API & Scoped API Keys**: Cryptographically generated `crm_live_...` secret keys with scope checks (`CUSTOMERS_READ`, `DEALS_WRITE`) and usage logging.

---

## 🛠️ Tech Stack & Architecture

### Backend
- **Runtime**: Node.js (ES6+)
- **Framework**: Express.js
- **Database & ORM**: PostgreSQL & Prisma ORM
- **Background Queues**: BullMQ & Redis
- **Real-Time Engine**: Socket.IO
- **Email Service**: Nodemailer
- **Logging & Security**: Pino, Helmet, Zod, bcrypt, jsonwebtoken

### Frontend
- **Framework**: React (Vite)
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS & Glassmorphism UI tokens

---

## 🚀 Quick Start Guide

### Option 1: Docker Compose (Recommended)

Run the full production-ready stack with Docker:

```bash
docker-compose up -d --build
```

- **Frontend UI**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api/v1`
- **Swagger Documentation**: `http://localhost:5000/api-docs`

---

### Option 2: Local Development Setup

#### 1. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run seed
npm run dev
```
*Backend server runs at `http://localhost:5000`*

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend app runs at `http://localhost:3000` or `http://localhost:5173`*

---

## 🧪 Automated Test Suite

To run all **101 integration tests (12 test suites)** across authentication, multi-tenancy, CRM, analytics, file uploads, security, and developer API keys:

```bash
cd backend
npm test
```

---

## 🔒 Security Notice

This repository uses environment variables (`.env.example`) for database connection strings and secret configuration. No private secrets or passwords are committed to source control.
