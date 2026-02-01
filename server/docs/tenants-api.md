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
