# Multi-Tenant SaaS CRM — API Specifications & Standards

## Base URLs
* **Versioned API (Recommended)**: `http://localhost:5000/api/v1`
* **Legacy API Alias**: `http://localhost:5000/api`
* **OpenAPI / Swagger UI**: `http://localhost:5000/api-docs`

---

## Standardized Response Structures

### Success Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "pagination": {
    "page": 0,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Your current FREE plan has reached its customers limit (100 / 100)",
  "errorCode": "PLAN_LIMIT_REACHED",
  "requestId": "req-1723580000-a1b2c3d4",
  "data": {
    "resource": "customers",
    "current": 100,
    "limit": 100,
    "plan": "FREE"
  }
}
```

---

## Standardized Pagination Query Parameters

All list endpoints accept:
- `page`: 0-indexed page number (default: `0`).
- `limit`: number of items per page (default: `20`, max: `100`).

Examples:
- `GET /api/v1/customers?page=0&limit=20`
- `GET /api/v1/leads?status=QUALIFIED&page=0&limit=10`
- `GET /api/v1/deals?search=Enterprise&page=0&limit=15`
- `GET /api/v1/tasks?status=IN_PROGRESS&page=0&limit=20`
- `GET /api/v1/audit-logs?page=0&limit=50`
