/**
 * Jest test setup file
 * Runs before each test suite to configure global test environment
 */

import { jest, expect } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-secret-key-min-32-chars-long-for-jwt-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Global test timeout
jest.setTimeout(10000);

// Add custom matchers
expect.extend({
  toBeValidJWT(received: string) {
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = jwtPattern.test(received);
    
    return {
      pass,
      message: () => 
        pass
          ? `expected ${received} not to be a valid JWT token`
          : `expected ${received} to be a valid JWT token format (header.payload.signature)`
    };
  },
  
  toBeValidBcryptHash(received: string) {
    // Bcrypt hash format: $2a$10$[22 character salt][31 character hash]
    const bcryptPattern = /^\$2[aby]\$\d{2}\$.{53}$/;
    const pass = bcryptPattern.test(received);
    
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid bcrypt hash`
          : `expected ${received} to be a valid bcrypt hash format`
    };
  }
});

// Export empty object to make this a module
export {};

