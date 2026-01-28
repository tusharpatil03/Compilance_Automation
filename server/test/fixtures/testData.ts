/**
 * Test fixtures - Sample data for testing
 * Provides consistent test data across test suites
 */

// sample strong passwords for testing
export const validPasswords = [
  'SecurePass123!',
  'MyP@ssw0rd',
  'Test1234!@#$',
  'Str0ng!Pass',
  'ValidP@ss99',
];

// sample invalid passwords for testing
export const invalidPasswords = [
  'short1!',            // Too short
  'nouppercase123!',    // No uppercase
  'NOLOWERCASE123!',    // No lowercase
  'NoNumber!',          // No number
  'NoSpecial123',       // No special character
  'password',           // Too weak
];

// sample tenants data
export const sampleTenants = [
  {
    id: 1,
    name: 'Acme Corporation',
    email: 'admin@acme.com',
    status: 'active' as const,
    created_at: '2026-01-28T10:00:00Z',
    updated_at: '2026-01-28T10:00:00Z',
  },
  {
    id: 2,
    name: 'Tech Solutions Inc',
    email: 'admin@techsolutions.com',
    status: 'active' as const,
    created_at: '2026-01-28T11:00:00Z',
    updated_at: '2026-01-28T11:00:00Z',
  },
  {
    id: 3,
    name: 'Inactive Corp',
    email: 'admin@inactive.com',
    status: 'inactive' as const,
    created_at: '2026-01-28T12:00:00Z',
    updated_at: '2026-01-28T12:00:00Z',
  },
];

// sample users data
export const sampleUsers = [
  {
    id: 1,
    tenant_id: 1,
    external_customer_id: 'CUST001',
    email: 'user1@test.com',
    name: 'John Doe',
    phone: '+1234567890',
    risk_score: 0,
    status: 'active',
    created_at: 1706443200,
    updated_at: 1706443200,
  },
  {
    id: 2,
    tenant_id: 1,
    external_customer_id: 'CUST002',
    email: 'user2@test.com',
    name: 'Jane Smith',
    phone: '+1234567891',
    risk_score: 50,
    status: 'active',
    created_at: 1706443200,
    updated_at: 1706443200,
  },
];

// sample JWT payloads for testing
export const sampleJWTPayloads = [
  { id: 1, email: 'test1@example.com' },
  { id: 2, email: 'test2@example.com' },
  { id: 999, email: 'admin@example.com' },
];

// sample API keys for testing
export const sampleApiKeys = [
  'sk_test_123456789abcdefghijklmnop',
  'sk_prod_abcdefghijklmnopqrstuvwxyz',
  'sk_dev_9876543210zyxwvutsrqponmlk',
];

// sample email addresses for testing
export const sampleEmails = {
  valid: [
    'user@example.com',
    'test.user@sub.domain.com',
    'user+tag@example.com',
    'user_name@example.co.uk',
  ],
  invalid: [
    'notanemail',
    '@example.com',
    'user@',
    'user @example.com',
    'user@.com',
  ],
};

// sample error messages for testing
export const errorMessages = {
  auth: {
    invalidCredentials: 'Invalid email or password',
    tenantNotActive: 'Tenant account is not active',
    tenantExists: 'Tenant already exists with this email',
    tokenExpired: 'Token has expired',
    invalidToken: 'Invalid token',
    missingSecret: 'JWT secret key is not defined',
  },
  validation: {
    requiredField: 'is required',
    invalidEmail: 'Invalid email address',
    passwordTooShort: 'Password must be at least',
    passwordRequirements: 'Password must contain',
  },
};

// sample database data for testing
export const mockDatabaseData = {
  tenants: sampleTenants,
  users: sampleUsers,
};

// sample API responses for testing
export const sampleResponses = {
  success: {
    register: {
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenant: sampleTenants[0],
        auth: {
          accessToken: 'mock.jwt.token',
          tokenType: 'Bearer',
          expiresIn: '1h',
        },
      },
    },
    login: {
      success: true,
      message: 'Login successful',
      data: {
        tenant: sampleTenants[0],
        auth: {
          accessToken: 'mock.jwt.token',
          tokenType: 'Bearer',
          expiresIn: '1h',
        },
      },
    },
  },
  error: {
    unauthorized: {
      success: false,
      message: 'Invalid email or password',
    },
    conflict: {
      success: false,
      message: 'Tenant already exists with this email',
    },
    forbidden: {
      success: false,
      message: 'Tenant account is suspended or inactive',
    },
  },
};
