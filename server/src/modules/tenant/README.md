# Tenant Module Documentation

## Overview
The **Tenant Module** provides authentication and authorization for tenant administrators in a multi-tenant SaaS application. It implements JWT-based authentication, secure password hashing, and prepares for future API key management features.

## Architecture

### Design Principles
- **Scalability**: Stateless JWT authentication, dependency injection, clean separation of concerns
- **Security**: Bcrypt password hashing with salt, JWT token-based auth, sanitized responses
- **Performance**: Optimized database queries, indexed lookups, minimal middleware overhead
- **Extensibility**: Prepared for API key management, RBAC, and tenant-level permissions

### Module Structure
```
tenant/
├── schema.ts              # Drizzle ORM table definitions (tenants, api_keys)
├── zodSchema.ts          # Zod validation schemas and TypeScript types
├── respository.ts        # Data access layer (CRUD operations)
├── routes.ts             # Express route definitions
├── controllers/
│   ├── register.ts       # Tenant registration controller
│   └── login.ts          # Tenant authentication controller
├── services/
│   ├── AuthService.ts    # Business logic for auth operations
│   └── createTenant.ts   # Legacy service (to be deprecated)
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
- `email`: Valid email format, max 255 characters
- `password`: 8-100 characters, must contain uppercase, number, and special character (!@#$%^&*)

**Error Responses**:
- `409 Conflict`: Tenant already exists with this email
- `400 Bad Request`: Validation errors
- `500 Internal Server Error`: Server-side errors

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

## Database Schema

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

### API Keys Table (Future Implementation)
```sql
CREATE TABLE tenants_api_keys (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    kid VARCHAR(128) NOT NULL,
    api_key_hash VARCHAR(512) NOT NULL,
    label VARCHAR(255) DEFAULT '',
    environment key_environment NOT NULL DEFAULT 'production',
    status tenant_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    rotated_from_key_id INTEGER REFERENCES tenants_api_keys(id)
);

CREATE TYPE key_environment AS ENUM ('production', 'staging', 'development');
```

## Security Features

### Password Security
- **Hashing**: Bcrypt with auto-generated salt (cost factor: 10)
- **Storage**: Never store plaintext passwords
- **Validation**: Strong password requirements enforced

### JWT Tokens
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 1 hour (configurable)
- **Payload**: `{ id, email }`
- **Secret**: Stored in environment variable `ACCESS_TOKEN_SECRET`

### Response Sanitization
- Passwords and salts are never included in API responses
- Only public tenant fields are returned

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
    password: 'SecurePass123!'
  })
});

const { data } = await registerResponse.json();
const accessToken = data.auth.accessToken;

// 2. Use token for authenticated requests (future API key endpoints)
const apiKeysResponse = await fetch('http://localhost:3000/tenant/api-keys', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### Using Authentication Middleware
```typescript
import { authenticateTenant, AuthenticatedRequest } from './middlewares/auth';

// Protect routes that require authentication
router.post('/api-keys', authenticateTenant, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenant?.id; // Extracted from JWT
  // ... create API key for tenant
});
```

## Environment Variables

Required environment variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
ACCESS_TOKEN_SECRET=your_secret_key_here_min_32_chars
```

## Future Enhancements

### API Key Management (Planned)
- **POST /tenant/api-keys**: Generate new API key
- **GET /tenant/api-keys**: List all API keys
- **DELETE /tenant/api-keys/:id**: Revoke API key
- **POST /tenant/api-keys/:id/rotate**: Rotate API key

### Features to Implement
- Key rotation with grace period
- Environment-specific keys (prod/staging/dev)
- Usage tracking and analytics
- Rate limiting per API key
- Scopes and permissions (RBAC)
- Audit logging for key events

## Performance Considerations

### Database Indexes
```sql
-- Recommended indexes for performance
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_api_keys_tenant_id ON tenants_api_keys(tenant_id);
CREATE INDEX idx_api_keys_kid ON tenants_api_keys(kid);
```

### Caching Strategy
- Consider caching tenant data in Redis for high-traffic scenarios
- Cache JWT verification results with short TTL
- Use database connection pooling (pg.Pool)

### Scalability Notes
- Stateless JWT auth allows horizontal scaling
- Repository pattern enables easy database swapping
- Dependency injection simplifies testing and mocking

## Testing

### Unit Tests (To Implement)
```typescript
// Example test structure
describe('AuthService', () => {
  it('should register tenant with hashed password', async () => {
    // ...
  });
  
  it('should reject duplicate email registration', async () => {
    // ...
  });
  
  it('should authenticate valid credentials', async () => {
    // ...
  });
});
```

### Integration Tests (To Implement)
```typescript
describe('POST /tenant/register', () => {
  it('should return 201 with JWT token', async () => {
    // ...
  });
});
```

## Migration Guide

### Running Migrations
```bash
# Generate migrations from schema
cd server
pnpm run db:generate

# Apply migrations to database
pnpm run db:push

# Check migration status
pnpm run db:status
```

## Troubleshooting

### Common Issues

**Issue**: "JWT secret key is not defined"
- **Solution**: Set `ACCESS_TOKEN_SECRET` in your `.env` file

**Issue**: "Tenant already exists with this email"
- **Solution**: Use a different email or delete existing tenant from database

**Issue**: "Invalid token"
- **Solution**: Token may be expired or malformed. Re-authenticate to get new token

**Issue**: Database connection errors
- **Solution**: Verify `DATABASE_URL` is correct and database is running

## Code Quality

### TypeScript
- Full type safety with Drizzle ORM inferred types
- Zod schemas for runtime validation
- No `any` types in public APIs

### Error Handling
- Proper HTTP status codes
- Descriptive error messages
- Caught and logged errors

### Code Organization
- Single Responsibility Principle
- Dependency Injection
- Repository pattern for data access
- Service layer for business logic

## Contributing

When adding features to the tenant module:
1. Update schema definitions in `schema.ts`
2. Add Zod validation in `zodSchema.ts`
3. Implement repository methods in `respository.ts`
4. Create service methods in `services/`
5. Add controller handlers in `controllers/`
6. Wire routes in `routes.ts`
7. Add tests
8. Update this documentation

## License
Internal use only - Part of Compliance Automation System
