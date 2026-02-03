# Tenants API

This document describes the Tenants API endpoints used by the frontend for tenant registration and login. It includes request and response formats, headers, examples, and common error responses.

Base URL (server runtime)

- For local development: http://localhost:3000 (confirm your server port)

## Authentication

- The register and login endpoints are public (no Authorization header required).
- Login returns a JWT access token which should be included in subsequent protected requests in the Authorization header as: `Authorization: Bearer <token>`.

---

## Endpoints

### 1) Register Tenant

- URL: POST /api/tenants/register
- Description: Creates a new tenant account and returns tenant data and authentication token.
- Content-Type: application/json

Request body (JSON):

```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

Field details:
- name (string): Tenant/company name. Required.
- email (string): Tenant email. Required. Must be unique.
- password (string): Plain-text password. Required. Backend will hash the password and store salt.

Success response (201 Created):

```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenant": {
      "id": 1,
      "name": "Test Company",
      "email": "user@example.com",
      "status": "active",
      "created_at": "2026-01-30T12:00:00.000Z",
      "updated_at": "2026-01-30T12:00:00.000Z"
    },
    "auth": {
      "accessToken": "<jwt-token>",
      "tokenType": "Bearer",
      "expiresIn": "1h"
    }
  }
}
```

Notes:
- The returned `tenant` object will NOT include the `password` or `salt` fields.
- The `accessToken` is a JWT signed by the server. The frontend should store it securely (e.g., in memory, or httpOnly cookie via server-set cookie). For SPAs, localStorage/sessionStorage is common but has XSS risks.

Common error responses:

- 409 Conflict - Tenant already exists with this email

```json
{
  "success": false,
  "message": "Tenant already exists with this email"
}
```

- 400 Bad Request - Missing/invalid fields (example)

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "email": "Email is required",
    "password": "Password is too weak"
  }
}
```

- 500 Internal Server Error - Generic server error

```json
{
  "success": false,
  "message": "Error registering tenant",
  "error": "<detailed error message>"
}
```

Example fetch (frontend):

```js
const payload = { name: 'Acme', email: 'user@example.com', password: 'Password123!' };
const res = await fetch('/api/tenants/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const json = await res.json();
if (res.ok) {
  // json.data.auth.accessToken contains JWT
}
```

---

### 2) Login Tenant

- URL: POST /api/tenants/login
- Description: Authenticates a tenant and returns tenant data and authentication token.
- Content-Type: application/json

Request body (JSON):

```json
{
  "email": "string",
  "password": "string"
}
```

Field details:
- email (string): Tenant email. Required.
- password (string): Tenant password. Required.

Success response (200 OK):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "tenant": {
      "id": 1,
      "name": "Test Company",
      "email": "user@example.com",
      "status": "active",
      "created_at": "2026-01-30T12:00:00.000Z",
      "updated_at": "2026-01-30T12:00:00.000Z"
    },
    "auth": {
      "accessToken": "<jwt-token>",
      "tokenType": "Bearer",
      "expiresIn": "1h"
    }
  }
}
```

Common error responses:

- 401 Unauthorized - Invalid credentials

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

- 403 Forbidden - Account suspended or inactive

```json
{
  "success": false,
  "message": "Tenant account is suspended or inactive"
}
```

- 400 Bad Request - Missing fields

```json
{
  "success": false,
  "message": "Email and password are required"
}
```

- 500 Internal Server Error - Generic server error

```json
{
  "success": false,
  "message": "Unable to login",
  "error": "<detailed error message>"
}
```

Example fetch (frontend):

```js
const payload = { email: 'user@example.com', password: 'Password123!' };
const res = await fetch('/api/tenants/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const json = await res.json();
if (res.ok) {
  // json.data.auth.accessToken contains JWT
}
```

---

## Frontend Notes and Examples

Headers:
- All requests should include Content-Type: application/json for JSON bodies.
- For authenticated requests (beyond login/register), include: Authorization: Bearer <token>

Security recommendations:
- Prefer httpOnly secure cookies for storing tokens when possible to mitigate XSS.
- If storing tokens in browser storage, implement CSRF protection on state-changing endpoints.

TypeScript interfaces (example):

```ts
export interface Tenant {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface AuthPayload {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string; // e.g., "1h"
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | Record<string, string>;
}
```

Quick axios example:

```ts
import axios from 'axios';

const register = (payload: RegisterRequest) =>
  axios.post<ApiResponse<{ tenant: Tenant; auth: AuthPayload }>>('/api/tenants/register', payload);

const login = (payload: LoginRequest) =>
  axios.post<ApiResponse<{ tenant: Tenant; auth: AuthPayload }>>('/api/tenants/login', payload);
```

---

## Next steps / Follow-ups

- Create an OpenAPI / Swagger spec for these endpoints to generate client code or import into Postman.
- Add example curl commands and security guidance for production deployments.

---

## Tenant API Keys

These endpoints manage tenant-scoped API keys. All endpoints below are protected and require an Authorization header with a valid tenant JWT: `Authorization: Bearer <token>`.

Base path: `/api/tenants` (adjust to your server mounting point). The examples below assume routes are mounted under that base path.

### 3) Create API Key

- URL: POST /api/tenants/api-keys
- Description: Creates a new API key for the authenticated tenant. The raw API key is returned only once at creation time; the server stores only a hash.
- Content-Type: application/json

Request body (JSON):

```json
{
  "label": "string (optional)",
  "expires_at": "ISO timestamp string (optional)",
  "tenant_id": "number (optional; ignored when authenticated)"
}
```

Success response (201 Created):

```json
{
  "message": "API key created successfully",
  "api_key": "<raw-api-key-string>",
  "key": {
    "id": 123,
    "tenant_id": 1,
    "kid": "kid_...",
    "label": "optional label",
    "status": "active",
    "created_at": "2026-01-30T12:00:00.000Z",
    "updated_at": "2026-01-30T12:00:00.000Z",
    "expires_at": "2026-02-01T00:00:00.000Z"
  }
}
```

Notes:
- The `api_key` field is shown only once; clients must store it securely.
- The server never returns or exposes `api_key_hash`.

Common error responses:
- 400 Bad Request - Missing input or validation error
- 409 Conflict - An active API key already exists (business rule)

### 4) List API Keys (paginated)

- URL: GET /api/tenants/api-keys
- Description: Returns a paginated list of API keys for the authenticated tenant.
- Query parameters (optional):
  - `limit` (number) - number of records to return (default: 10, max: 100)
  - `offset` (number) - zero-based offset (default: 0)

Success response (200 OK):

```json
{
  "data": [
    {
      "id": 123,
      "tenant_id": 1,
      "kid": "kid_...",
      "label": "optional label",
      "status": "active",
      "created_at": "2026-01-30T12:00:00.000Z",
      "updated_at": "2026-01-30T12:00:00.000Z",
      "expires_at": "2026-02-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "count": 1
  }
}
```

Notes:
- `api_key_hash` is not returned.
- Use `limit` and `offset` for pagination. The server will clamp `limit` to a safe maximum.

### 5) Change API Key Status (deactivate)

- URL: POST /api/tenants/api-keys/:id
- Description: Change the status of a key identified by `kid` (path param `:id`). Currently supports setting status to `inactive` (deactivation).
- Content-Type: application/json

Request body (JSON):

```json
{
  "status": "inactive"
}
```

Success response (200 OK):

```json
{
  "message": "API key with ID kid_... has been deactivated."
}
```

Notes:
- The operation is idempotent: deactivating an already inactive key succeeds with 200.
- If the key does not belong to the authenticated tenant, server returns 403 Forbidden.

### 6) Remove API Key

- URL: DELETE /api/tenants/api-keys/:id
- Description: Permanently removes the API key record (server-side). This action is scoped to the authenticated tenant.

Success response (200 OK):

```json
{
  "message": "API key with ID kid_... has been removed."
}
```

Errors:
- 400 Bad Request - Missing ID
- 403 Forbidden - Attempt to remove a key that belongs to another tenant
- 404 Not Found - Key not found

---

Security and lifecycle guidance
- Show the raw API secret only once at creation time. Encourage clients to rotate and store the key securely.
- Track `last_used_at` server-side to detect stale keys and help with audits.
- Use short expiry windows if appropriate and rotate keys regularly.

SDK / frontend tips
- After creating a key, immediately store the provided `api_key` securely (e.g., server-managed secret or secure vault). Do not rely on client-side storage if you can avoid it.

