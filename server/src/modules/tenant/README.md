# Tenant Module Documentation

## Overview

The **Tenant Module** provides authentication and authorization for tenant administrators in a multi-tenant SaaS application. It implements JWT-based authentication, secure password hashing, and comprehensive API key management with support for key rotation, expiration, and revocation.

## Architecture

### Design Principles

- **Scalability**: Stateless JWT authentication, dependency injection, clean separation of concerns
- **Security**: Bcrypt password hashing with salt, JWT token-based auth, encrypted API keys, hashed key storage, sanitized responses
- **Performance**: Optimized database queries, indexed lookups, minimal middleware overhead
- **Extensibility**: API key management with rotation support, RBAC-ready, tenant-level permissions, webhook events

### Module Structure

```
tenant/
├── schema.ts              # Drizzle ORM table definitions (tenants, api_keys, webhooks)
├── zodSchema.ts          # Zod validation schemas and TypeScript types
├── respository.ts        # Data access layer (CRUD operations)
├── routes.ts             # Express route definitions
├── controllers/
│   ├── register.ts       # Tenant registration controller
│   ├── login.ts          # Tenant authentication controller
│   ├── createApikey.ts   # API key creation controller
│   ├── listApiKeys.ts    # API key listing controller
│   ├── changeApiKeyStatus.ts  # API key status change controller
│   └── removeApiKey.ts   # API key removal controller
├── services/
│   ├── AuthService.ts    # Business logic for auth operations
│   └── TenantApiServices.ts  # Business logic for API key and webhook operations
└── middlewares/
    └── auth.ts           # JWT authentication middleware
```

## Features

### 1. Tenant Registration

**Endpoint**: `POST /tenant/register`

**Request Body**:

```json
{
  "name": "Acme Corporation",
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenant": {
      "id": 1,
      "name": "Acme Corporation",
      "email": "admin@acme.com",
      "status": "active",
      "created_at": "2026-01-28T10:30:00Z",
      "updated_at": "2026-01-28T10:30:00Z"
    },
    "auth": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "tokenType": "Bearer",
      "expiresIn": "1h"
    }
  }
}
```

**Validation Rules**:

- `name`: 3-255 characters, trimmed
- `email`: Valid email format, max 255 characters, unique
- `password`: 8-100 characters, must contain uppercase, number, and special character (!@#$%^&*)

**Error Responses**:

- `409 Conflict`: Tenant already exists with this email
- `400 Bad Request`: Validation errors
- `500 Internal Server Error`: Server-side errors

---

### 2. Tenant Login

**Endpoint**: `POST /tenant/login`

**Request Body**:

```json
{
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "tenant": {
      "id": 1,
      "name": "Acme Corporation",
      "email": "admin@acme.com",
      "status": "active",
      "created_at": "2026-01-28T10:30:00Z",
      "updated_at": "2026-01-28T10:30:00Z"
    },
    "auth": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "tokenType": "Bearer",
      "expiresIn": "1h"
    }
  }
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid email or password
- `403 Forbidden`: Tenant account is suspended or inactive
- `500 Internal Server Error`: Server-side errors

---

### 3. Create API Key

**Endpoint**: `POST /tenant/api-keys`

**Authentication**: Required (Bearer token)

**Request Body**:

```json
{
  "kid": "my-production-key",
  "expires_at": "2026-12-31T23:59:59Z"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "API key created successfully",
  "data": {
    "api_key": "bcrypt_generated_key_string",
    "key": {
      "id": 1,
      "tenant_id": 1,
      "key_prefix": "my-production-key",
      "status": "active",
      "created_at": "2026-01-28T10:30:00Z",
      "updated_at": "2026-01-28T10:30:00Z",
      "expires_at": "2026-12-31T23:59:59Z",
      "revoked_at": null
    }
  }
}
```

**Parameters**:

- `kid`: (required) Key identifier/prefix, max 128 characters
- `expires_at`: (optional) ISO timestamp for key expiration

**Error Responses**:

- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Authentication required
- `409 Conflict`: Key already exists

---

### 4. List API Keys

**Endpoint**: `GET /tenant/api-keys?limit=50&offset=0`

**Authentication**: Required (Bearer token)

**Query Parameters**:

- `limit`: (optional) Max 100, default 50
- `offset`: (optional) Default 0

**Response** (200 OK):

```json
{
  "success": true,
  "message": "API keys retrieved successfully",
  "data": [
    {
      "id": 1,
      "tenant_id": 1,
      "key_prefix": "my-production-key",
      "status": "active",
      "created_at": "2026-01-28T10:30:00Z",
      "updated_at": "2026-01-28T10:30:00Z",
      "expires_at": "2026-12-31T23:59:59Z",
      "revoked_at": null
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

**Note**: `api_key_hash` is never returned for security reasons.

---

### 5. Change API Key Status

**Endpoint**: `PATCH /tenant/api-keys`

**Authentication**: Required (Bearer token)

**Request Body**:

```json
{
  "kid": "my-production-key",
  "status": "inactive"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "API key has been deactivated"
}
```

**Parameters**:

- `kid`: (required) Key identifier to modify
- `status`: (required) Either `"inactive"` or `"revoked"`

**Status Meanings**:

- `inactive`: Temporarily disable key (can be reactivated)
- `revoked`: Permanently revoke key with timestamp (cannot be reactivated)

**Error Responses**:

- `400 Bad Request`: Validation errors or invalid status
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Key doesn't belong to authenticated tenant
- `404 Not Found`: Key not found

---

### 6. Remove API Key

**Endpoint**: `DELETE /tenant/api-keys`

**Authentication**: Required (Bearer token)

**Request Body**:

```json
{
  "kid": "my-production-key"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "API key has been removed"
}
```

**Parameters**:

- `kid`: (required) Key identifier to remove

**Note**: This permanently deletes the key record from the database.

**Error Responses**:

- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Key doesn't belong to authenticated tenant
- `404 Not Found`: Key not found

---

### 7. Create Webhook

**Endpoint**: `POST /tenant/webhooks`

**Authentication**: Required (Bearer token)

**Request Body**:

```json
{
  "url": "https://example.com/webhooks/tenant",
  "events": ["api_key.created", "api_key.deactivated"]
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": "Webhook created successfully",
  "data": {
    "id": 1,
    "tenant_id": 1,
    "url": "https://example.com/webhooks/tenant",
    "events": ["api_key.created", "api_key.deactivated"],
    "created_at": "2026-04-18T10:30:00Z",
    "updated_at": "2026-04-18T10:30:00Z"
  }
}
```

**Parameters**:

- `url`: (required) Valid HTTPS URL for webhook delivery, max 2048 characters
- `events`: (optional) Array of event types to subscribe to

**Supported Events**:

- `api_key.created` - Triggered when an API key is created
- `api_key.deactivated` - Triggered when an API key is deactivated
- `api_key.revoked` - Triggered when an API key is revoked
- `tenant.updated` - Triggered when tenant information is updated

**Error Responses**:

- `400 Bad Request`: Validation errors or invalid URL
- `401 Unauthorized`: Authentication required
- `409 Conflict`: Webhook already exists

---

### 8. List Webhooks

**Endpoint**: `GET /tenant/webhooks?limit=50&offset=0`

**Authentication**: Required (Bearer token)

**Query Parameters**:

- `limit`: (optional) Max 100, default 50
- `offset`: (optional) Default 0

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Webhooks retrieved successfully",
  "data": [
    {
      "id": 1,
      "tenant_id": 1,
      "url": "https://example.com/webhooks/tenant",
      "events": ["api_key.created", "api_key.deactivated"],
      "created_at": "2026-04-18T10:30:00Z",
      "updated_at": "2026-04-18T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

**Note**: Webhook secrets are never returned for security reasons.

**Error Responses**:

- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Authentication required

---

### 9. Delete Webhook

**Endpoint**: `DELETE /tenant/webhooks/:id`

**Authentication**: Required (Bearer token)

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Webhook deleted successfully"
}
```

**Parameters**:

- `id`: (required) Webhook ID to delete (URL parameter)

**Error Responses**:

- `400 Bad Request`: Invalid webhook ID
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Webhook not found or doesn't belong to tenant

---

### Tenants Table

```sql
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,  -- bcrypt hashed
    salt VARCHAR(255) NOT NULL,
    status tenant_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE tenant_status AS ENUM ('active', 'inactive', 'suspended');
```

### API Keys Table

```sql
CREATE TABLE tenants_api_keys (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    api_key VARCHAR(255) NOT NULL,        -- encrypted key
    api_key_hash VARCHAR(512) NOT NULL,   -- bcrypt hash for validation
    key_prefix VARCHAR(20) NOT NULL,      -- business identifier (kid)
    status apikey_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,                 -- optional expiration
    revoked_at TIMESTAMP,                 -- set when revoked
    rotated_from_key_id INTEGER REFERENCES tenants_api_keys(id),  -- for rotation tracking
    UNIQUE(tenant_id, key_prefix)
);

CREATE TYPE apikey_status AS ENUM ('active', 'inactive', 'revoked');
CREATE INDEX ix_tenantapikey_tenant ON tenants_api_keys(tenant_id);
```

### Webhooks Table (Future Implementation)

```sql
CREATE TABLE webhooks (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    url VARCHAR(2048) NOT NULL,
    events JSONB NOT NULL,  -- array of event types
    secret VARCHAR(255) NOT NULL,  -- for signing payloads
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Security Features

### Password Security

- **Hashing**: Bcrypt with auto-generated salt (cost factor: 10)
- **Storage**: Never store plaintext passwords
- **Validation**: Strong password requirements enforced

### API Key Security

- **Encryption**: AES-256-CBC encryption for stored keys
- **Hashing**: Bcrypt hashing of key material for validation
- **Key Prefix**: Public identifier without exposing the actual key
- **Status Management**: Active, inactive, revoked states
- **Expiration**: Optional timestamp-based expiration
- **Revocation Tracking**: Records when keys are revoked

### JWT Tokens

- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 1 hour (configurable)
- **Payload**: `{ id, email }`
- **Secret**: Stored in environment variable `ACCESS_TOKEN_SECRET`

### Response Sanitization

- Passwords and salts are never included in API responses
- API key hashes are never returned to clients
- Only public tenant fields are returned
- Only metadata about API keys is exposed

---

## API Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": { ... }  // optional, includes validation details
}
```

---

## API Usage Examples

### Register and Login Flow

```typescript
// 1. Register new tenant
const registerResponse = await fetch('http://localhost:3000/tenant/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Acme Corp',
    email: 'admin@acme.com',
    password: 'SecurePass123!',
  }),
});

const { data } = await registerResponse.json();
const accessToken = data.auth.accessToken;

// 2. Create API key
const createKeyResponse = await fetch('http://localhost:3000/tenant/api-keys', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    kid: 'prod-key-1',
    expires_at: '2026-12-31T23:59:59Z',
  }),
});

const { data: keyData } = await createKeyResponse.json();
const apiKey = keyData.api_key; // One-time reveal

// 3. List API keys
const listResponse = await fetch(
  'http://localhost:3000/tenant/api-keys?limit=10&offset=0',
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);

// 4. Change key status
const statusResponse = await fetch('http://localhost:3000/tenant/api-keys', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    kid: 'prod-key-1',
    status: 'inactive',
  }),
});

// 5. Remove API key
const removeResponse = await fetch('http://localhost:3000/tenant/api-keys', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    kid: 'prod-key-1',
  }),
});

// 6. Create webhook subscription
const createWebhookResponse = await fetch(
  'http://localhost:3000/tenant/webhooks',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      url: 'https://example.com/webhooks/tenant',
      events: ['api_key.created', 'api_key.deactivated'],
    }),
  }
);

// 7. List webhooks
const listWebhooksResponse = await fetch(
  'http://localhost:3000/tenant/webhooks?limit=10',
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);

// 8. Delete webhook
const deleteWebhookResponse = await fetch(
  'http://localhost:3000/tenant/webhooks/1',
  {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

---

## Environment Variables

Required environment variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
ACCESS_TOKEN_SECRET=your_secret_key_here_min_32_chars
API_KEY_ENCRYPTION_SECRET=your_encryption_secret_hex_64_chars
WEBHOOK_SECRET=your_webhook_secret_here
```

---

## Service Layer Integration

The service layer provides business logic for API key validation and management:

```typescript
const service = new TenantApiServices();

// Create API key
await service.createApiKey(payload);

// Deactivate API key (sets status to inactive)
await service.deactivateApiKey(kid, tenantId);

// Revoke API key (sets status to revoked, records timestamp)
await service.revokeApiKey(kid, tenantId);

// Remove API key (deletes from database)
await service.removeApiKey(kid, tenantId);

// Validate API key (checks status, expiration, revocation)
const isValid = await service.validateApiKey(kid, tenantId);

// List API keys
await service.listApiKeys(tenantId, { limit: 50, offset: 0 });
```

---

## Future Enhancements

### ✅ Webhook Management (Endpoints Implemented)

- ✅ **POST /tenant/webhooks**: Subscribe to events
- ✅ **GET /tenant/webhooks**: List subscriptions
- ✅ **DELETE /tenant/webhooks/:id**: Remove subscription
- ✅ **Events**: api_key.created, api_key.deactivated, api_key.revoked, tenant.updated

**Remaining Webhook Work**:

- Implement actual webhook delivery mechanism
- Add payload signing with HMAC-SHA256
- Add retry logic for failed deliveries
- Track webhook delivery status

### Key Rotation

- Automatic rotation with grace period
- Seamless migration between keys
- Usage tracking via `rotated_from_key_id`

### Features to Implement

- Usage analytics and tracking
- Rate limiting per API key
- RBAC scopes and permissions
- Audit logging for all key events
- Key rotation policies
- Environment-specific configuration

---

## Error Handling

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Validation error or invalid input
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Permission denied or insufficient access
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists or conflict
- `500 Internal Server Error`: Server-side error

### Error Response Format

All error responses follow this standardized format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERR_XXX_ERROR_CODE",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

### Error Codes

#### Authentication Errors (4xx)

| Code                    | HTTP | Description                    |
| ----------------------- | ---- | ------------------------------ |
| `ERR_401_AUTH_REQUIRED` | 401  | Authentication token required  |
| `ERR_401_INVALID_TOKEN` | 401  | Invalid or malformed JWT token |
| `ERR_401_TOKEN_EXPIRED` | 401  | Token has expired              |

#### Validation Errors (4xx)

| Code                        | HTTP | Description                         |
| --------------------------- | ---- | ----------------------------------- |
| `ERR_400_VALIDATION_ERROR`  | 400  | Input validation failed             |
| `ERR_400_INVALID_EMAIL`     | 400  | Invalid email address format        |
| `ERR_400_INVALID_PASSWORD`  | 400  | Password does not meet requirements |
| `ERR_400_INVALID_URL`       | 400  | Invalid HTTPS URL                   |
| `ERR_400_INVALID_TIMESTAMP` | 400  | Invalid ISO 8601 timestamp format   |
| `ERR_400_INVALID_ID`        | 400  | Invalid numeric ID                  |
| `ERR_400_MISSING_FIELD`     | 400  | Required field is missing           |

#### Authorization Errors (4xx)

| Code                               | HTTP | Description                   |
| ---------------------------------- | ---- | ----------------------------- |
| `ERR_403_FORBIDDEN`                | 403  | Access denied                 |
| `ERR_403_INSUFFICIENT_PERMISSIONS` | 403  | Insufficient permissions      |
| `ERR_403_KEY_DOES_NOT_BELONG`      | 403  | Key does not belong to tenant |

#### Not Found Errors (4xx)

| Code                        | HTTP | Description                |
| --------------------------- | ---- | -------------------------- |
| `ERR_404_NOT_FOUND`         | 404  | Generic resource not found |
| `ERR_404_TENANT_NOT_FOUND`  | 404  | Tenant does not exist      |
| `ERR_404_API_KEY_NOT_FOUND` | 404  | API key does not exist     |
| `ERR_404_WEBHOOK_NOT_FOUND` | 404  | Webhook does not exist     |

#### Conflict Errors (4xx)

| Code                      | HTTP | Description              |
| ------------------------- | ---- | ------------------------ |
| `ERR_409_CONFLICT`        | 409  | Resource conflict        |
| `ERR_409_TENANT_EXISTS`   | 409  | Tenant already exists    |
| `ERR_409_KEY_EXISTS`      | 409  | API key already exists   |
| `ERR_409_WEBHOOK_EXISTS`  | 409  | Webhook already exists   |
| `ERR_409_DUPLICATE_EMAIL` | 409  | Email already registered |

#### Server Errors (5xx)

| Code                       | HTTP | Description                      |
| -------------------------- | ---- | -------------------------------- |
| `ERR_500_INTERNAL_ERROR`   | 500  | Internal server error            |
| `ERR_500_DATABASE_ERROR`   | 500  | Database operation failed        |
| `ERR_500_ENCRYPTION_ERROR` | 500  | Key encryption/decryption failed |

### Validation Rules

#### Password Requirements

- Minimum 8 characters
- Maximum 100 characters
- At least one uppercase letter
- At least one number
- At least one special character (!@#$%^&*)

Example valid password: `SecurePass123!`

#### Email

- Must be valid email format
- Maximum 255 characters
- Must be unique per tenant

#### API Key ID (kid)

- Minimum 1 character
- Maximum 128 characters
- Only alphanumeric characters, hyphens, and underscores allowed
- Must be unique per tenant

Example: `prod-api-key-v1`

#### Webhook URL

- Must be valid HTTPS URL (SSL/TLS required)
- Maximum 2048 characters
- Must be reachable and return 200 status

#### Expiration Timestamp

- Must be valid ISO 8601 format
- Must be in the future
- Examples: `2026-12-31T23:59:59Z`, `2026-01-15T10:30:00Z`

#### Query Parameters

- `limit`: 1-100 (default 50)
- `offset`: 0+ (default 0)

### Example Error Responses

**Validation Error:**

```json
{
  "success": false,
  "message": "Validation error",
  "code": "ERR_400_VALIDATION_ERROR",
  "errors": {
    "email": ["Invalid email address format"],
    "password": [
      "Password must contain at least one special character (!@#$%^&*)"
    ]
  }
}
```

**Authentication Error:**

```json
{
  "success": false,
  "message": "Authentication required",
  "code": "ERR_401_AUTH_REQUIRED"
}
```

**Conflict Error:**

```json
{
  "success": false,
  "message": "Tenant with email 'admin@acme.com' already exists",
  "code": "ERR_409_TENANT_EXISTS"
}
```

**Not Found Error:**

```json
{
  "success": false,
  "message": "API key 'prod-key-1' not found",
  "code": "ERR_404_API_KEY_NOT_FOUND"
}
```

---

## Testing

### Unit Tests (To Implement)

```typescript
describe('TenantApiServices', () => {
  it('should create API key with encryption', async () => {});
  it('should validate active keys only', async () => {});
  it('should reject expired keys', async () => {});
  it('should reject revoked keys', async () => {});
  it('should deactivate but preserve key', async () => {});
  it('should revoke and record timestamp', async () => {});
});
```

---

## Contributing

When adding features to the tenant module:

1. Update schema definitions in `schema.ts`
2. Add Zod validation schemas in `zodSchema.ts`
3. Implement repository methods in `respository.ts`
4. Create service methods in `services/`
5. Add controller handlers in `controllers/`
6. Update routes in `routes.ts`
7. Ensure consistent response format
8. Add tests
9. Update this documentation

---

## License

Internal use only - Part of Compliance Automation System
