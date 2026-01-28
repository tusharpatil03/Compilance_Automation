/**
 * Test helper utilities
 * Reusable functions for test setup, assertions, and data generation
 */

import { expect } from '@jest/globals';

// waite for specified milliseconds
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// generate a random string of specified length
export const randomString = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// generate a random email address
export const randomEmail = (): string => {
  return `test${randomString(8)}@example.com`.toLowerCase();
};

// generate a strong password
export const generateStrongPassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  return (
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    lowercase.substring(0, 5) +
    numbers[Math.floor(Math.random() * numbers.length)] +
    special[Math.floor(Math.random() * special.length)] +
    randomString(3)
  );
};

// create a test user payload
export const createTestUser = (overrides?: any) => {
  return {
    name: 'Test User',
    email: randomEmail(),
    password: generateStrongPassword(),
    ...overrides
  };
};

// create a test tenant payload
export const createTestTenant = (overrides?: any) => {
  return {
    name: `Test Tenant ${randomString(5)}`,
    email: randomEmail(),
    password: generateStrongPassword(),
    ...overrides
  };
};

// create a test organization payload
export const expectToThrowWithMessage = (
  fn: () => any,
  expectedMessage: string | RegExp
) => {
  try {
    fn();
    throw new Error('Expected function to throw but it did not');
  } catch (error) {
    if (error instanceof Error) {
      if (typeof expectedMessage === 'string') {
        expect(error.message).toContain(expectedMessage);
      } else {
        expect(error.message).toMatch(expectedMessage);
      }
    }
  }
};

// async version of expectToThrowWithMessage
export const expectAsyncToThrowWithMessage = async (
  fn: () => Promise<any>,
  expectedMessage: string | RegExp
) => {
  try {
    await fn();
    throw new Error('Expected function to throw but it did not');
  } catch (error) {
    if (error instanceof Error) {
      if (typeof expectedMessage === 'string') {
        expect(error.message).toContain(expectedMessage);
      } else {
        expect(error.message).toMatch(expectedMessage);
      }
    }
  }
};

// mock environment variable temporarily
export const withEnv = <T>(
  envVars: Record<string, string | undefined>,
  fn: () => T
): T => {
  const original: Record<string, string | undefined> = {};
  
  // Save original values
  Object.keys(envVars).forEach(key => {
    original[key] = process.env[key];
  });
  
  // Set new values
  Object.entries(envVars).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
  
  try {
    return fn();
  } finally {
    // Restore original values
    Object.entries(original).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
};

// mock environment variable temporarily for async functions
export const withEnvAsync = async <T>(
  envVars: Record<string, string | undefined>,
  fn: () => Promise<T>
): Promise<T> => {
  const original: Record<string, string | undefined> = {};
  
  // Save original values
  Object.keys(envVars).forEach(key => {
    original[key] = process.env[key];
  });
  
  // Set new values
  Object.entries(envVars).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
  
  try {
    return await fn();
  } finally {
    // Restore original values
    Object.entries(original).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
};
