# Multi-Tenant SaaS CRM — Security Audit & Controls

## Executive Security Model

Security and multi-tenant isolation are enforced at every architectural tier:

### 1. Strict Tenant Isolation
* **JWT-Derived Context**: `companyId` is strictly extracted from `req.user.companyId` populated by the verified JWT access token. Client-supplied `companyId` in bodies or headers is ignored.
* **Query Scoping**: Every Prisma database read/write includes `where: { companyId, deletedAt: null }`.
* **Cross-Tenant Access Rejection**: Requests attempting to view or modify entities belonging to another company return `403 TENANT_ACCESS_DENIED` or `404 NOT_FOUND`.

### 2. Authentication & Session Management
* **JWT Access Tokens**: Short-lived (15 min) access tokens containing `userId`, `companyId`, `role`.
* **Refresh Token Rotation**: Refresh tokens (7 days) are stored as SHA256 hashes in `refresh_tokens`. Upon refresh (`POST /api/auth/refresh`), the old token is invalidated (`revoked: true, revokedAt: new Date()`) and a new pair is issued.
* **Session Revocation**: `POST /api/auth/logout-all` invalidates all active refresh tokens for the user.

### 3. Brute-Force & Lockout Controls
* **Rate Limiting**:
  * General API: 100 requests per 15 minutes per IP.
  * Auth endpoints (`/login`, `/register`, `/refresh`, `/forgot-password`): 10 requests per 15 minutes per IP.
* **Account Lockout**: 5 consecutive failed login attempts result in a temporary 15-minute account lock.

### 4. Password Security Policy
* Hashes passwords using `bcrypt` (10 salt rounds).
* **Policy Enforcement**: Minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character (`!@#$%^&*()_+-=[]{}|;:,.<>?`).
* Passwords are never logged, never returned in API payloads, and never saved in audit trails.

### 5. Single-Use Password Reset
* `POST /api/auth/forgot-password` generates a 32-byte cryptographically secure random token, hashes it with SHA256, and stores it with a 1-hour expiration.
* Generic response `"If an account exists, a password reset link has been sent."` prevents email enumeration attacks.
* `POST /api/auth/reset-password` verifies token hash, updates password hash, marks token `usedAt = new Date()`, and invalidates all existing refresh tokens.

### 6. HTTP & File Upload Security
* **Helmet Headers**: Protects against XSS (`X-XSS-Protection`), MIME sniffing (`X-Content-Type-Options: nosniff`), clickjacking (`X-Frame-Options: DENY`), and unsafe framing.
* **CORS**: Restricted to configured `FRONTEND_URL`. Wildcard `origin: "*"` is prohibited.
* **File Storage**: Uploads saved outside public web roots at `uploads/company/{companyId}/{storageKey}`. File streaming requires authentication and tenant verification.
