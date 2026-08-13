# Multi-Tenant SaaS CRM — System Architecture Documentation

## Overview
The Multi-Tenant SaaS CRM is designed with a modern decoupled architecture using React (Vite) on the frontend and Node.js (Express & Prisma ORM) on the backend, with PostgreSQL as the relational database, Redis for caching and background queues, and Socket.IO for real-time notifications.

---

## Architectural Component Diagram

```mermaid
flowchart TD
    subgraph Client Layer
        Web[React Single Page Application]
        Mobile[Mobile Web / Responsive Client]
    end

    subgraph API Gateway & Security
        Helmet[Helmet Security Headers]
        CORS[CORS Strict Origin Middleware]
        Limiter[Express Rate Limiter & Lockout Guard]
        ReqID[X-Request-ID Propagator]
    end

    subgraph Backend Application Services
        Express[Node.js Express App (/api/v1 & /api)]
        Auth[JWT Auth & RBAC Guard]
        Tenant[Tenant Isolation Layer]
        Controllers[Resource Controllers]
        Services[Business Logic & Usage Sync]
        QueueService[BullMQ & Redis Queue Service]
        SocketServer[Real-Time Socket.IO Server]
    end

    subgraph Data & Storage Layer
        Prisma[Prisma ORM]
        PostgreSQL[(PostgreSQL Relational DB)]
        Redis[(Redis Cache & Queue Store)]
        Disk[Local File Storage: uploads/company/companyId/]
        SMTP[SMTP Email Server]
    end

    Web -->|HTTPS REST| Helmet
    Mobile -->|HTTPS REST| Helmet
    Web -->|WebSocket| SocketServer

    Helmet --> CORS --> Limiter --> ReqID --> Express
    Express --> Auth --> Tenant --> Controllers --> Services

    Services --> Prisma --> PostgreSQL
    Services --> QueueService --> Redis
    QueueService --> SMTP
    Services --> Disk
    Services --> SocketServer
```

---

## Core Technologies

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React, Vite, TailwindCSS, Recharts, Lucide Icons | Responsive Executive Dashboard, Pipeline Kanban, Activity Timelines |
| **Backend** | Node.js, Express, Pure ES6+ JavaScript | RESTful API Server, Security Controls, API Versioning (`/api/v1`) |
| **Database** | PostgreSQL 16, Prisma ORM | Relational Data Model, Atomic Transactions, Cascade Cleanup |
| **Caching & Queues** | Redis 7, BullMQ | Asynchronous Email Jobs, Overdue Task Scans, Meeting Reminders |
| **Real-Time** | Socket.IO | User-scoped notification delivery rooms (`user:${userId}`) |
| **Logging** | Pino, Pino-HTTP | Structured JSON logging with sensitive data redaction |
| **Containerization** | Docker, Docker Compose | Multi-container production deployment |
