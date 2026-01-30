/**
 * Unit tests for security utilities
 * Tests password hashing, comparison, API key generation, and JWT token handling
 * 
 * @group unit
 * @group security
 */

import { describe, it, expect } from '@jest/globals';

import {
  hashPassword,
  comparePassword,
  generateApiKey,
  hashApiKey,
  generateJWTToken,
  JWTPayload
} from '../../src/utils/security';
import jwt from 'jsonwebtoken';

describe('Security Utils - Password Hashing', () => {
  describe('hashPassword', () => {
    it('should return hashed password and salt', () => {
      const password = 'SecurePass123!';
      const result = hashPassword(password);

      expect(result).toHaveProperty('hashedPassword');
      expect(result).toHaveProperty('salt');
      expect(typeof result.hashedPassword).toBe('string');
      expect(typeof result.salt).toBe('string');
      expect(result.hashedPassword.length).toBeGreaterThan(0);
      expect(result.salt.length).toBeGreaterThan(0);
    });

    it('should generate different salts for same password', () => {
      const password = 'TestPassword123!';
      const result1 = hashPassword(password);
      const result2 = hashPassword(password);

      // Different salts should produce different hashes
      expect(result1.salt).not.toBe(result2.salt);
      expect(result1.hashedPassword).not.toBe(result2.hashedPassword);
    });

    it('should use provided salt when given', () => {
      const password = 'MyPassword123!';
      const customSalt = '$2a$10$abcdefghijklmnopqrstuv';
      
      const result1 = hashPassword(password, customSalt);
      const result2 = hashPassword(password, customSalt);

      // Same password + same salt = same hash
      expect(result1.salt).toBe(customSalt);
      expect(result2.salt).toBe(customSalt);
      expect(result1.hashedPassword).toBe(result2.hashedPassword);
    });

    it('should handle empty password', () => {
      const result = hashPassword('');
      
      expect(result.hashedPassword).toBeDefined();
      expect(result.salt).toBeDefined();
    });

    it('should handle very long passwords', () => {
      const longPassword = 'a'.repeat(100);
      const result = hashPassword(longPassword);

      expect(result.hashedPassword).toBeDefined();
      expect(result.salt).toBeDefined();
    });

    it('should handle special characters in password', () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
      const result = hashPassword(specialPassword);

      expect(result.hashedPassword).toBeDefined();
      expect(result.salt).toBeDefined();
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', () => {
      const password = 'CorrectPassword123!';
      const { hashedPassword, salt } = hashPassword(password);

      const result = comparePassword(password, hashedPassword, salt);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', () => {
      const correctPassword = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const { hashedPassword, salt } = hashPassword(correctPassword);

      const result = comparePassword(wrongPassword, hashedPassword, salt);

      expect(result).toBe(false);
    });

    it('should return false for empty password', () => {
      const password = 'ValidPassword123!';
      const { hashedPassword, salt } = hashPassword(password);

      const result = comparePassword('', hashedPassword, salt);

      expect(result).toBe(false);
    });

    it('should return false with wrong salt', () => {
      const password = 'TestPassword123!';
      const { hashedPassword } = hashPassword(password);
      const wrongSalt = '$2a$10$wrongsaltwrongsaltwrong';

      const result = comparePassword(password, hashedPassword, wrongSalt);

      expect(result).toBe(false);
    });

    it('should be case sensitive', () => {
      const password = 'CaseSensitive123!';
      const { hashedPassword, salt } = hashPassword(password);

      const resultLower = comparePassword('casesensitive123!', hashedPassword, salt);
      const resultUpper = comparePassword('CASESENSITIVE123!', hashedPassword, salt);

      expect(resultLower).toBe(false);
      expect(resultUpper).toBe(false);
    });
  });
});

describe('Security Utils - API Key Generation', () => {
  describe('generateApiKey', () => {
    it('should generate a non-empty API key', () => {
      const apiKey = generateApiKey();

      expect(apiKey).toBeDefined();
      expect(typeof apiKey).toBe('string');
      expect(apiKey.length).toBeGreaterThan(0);
    });

    it('should generate unique API keys', () => {
      const apiKey1 = generateApiKey();
      const apiKey2 = generateApiKey();
      const apiKey3 = generateApiKey();

      expect(apiKey1).not.toBe(apiKey2);
      expect(apiKey2).not.toBe(apiKey3);
      expect(apiKey1).not.toBe(apiKey3);
    });

    it('should not contain forward slashes (URL safe)', () => {
      // Generate multiple keys to ensure consistency
      for (let i = 0; i < 10; i++) {
        const apiKey = generateApiKey();
        expect(apiKey).not.toContain('/');
      }
    });

    it('should generate keys of reasonable length', () => {
      const apiKey = generateApiKey();
      
      // Bcrypt salt without slashes should be around 20+ chars
      expect(apiKey.length).toBeGreaterThan(15);
      expect(apiKey.length).toBeLessThan(50);
    });
  });

  describe('hashApiKey', () => {
    it('should hash API key to bcrypt format', () => {
      const apiKey = 'test-api-key-12345';
      const hashed = hashApiKey(apiKey);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same API key (bcrypt salt)', () => {
      const apiKey = 'same-api-key-12345';
      const hash1 = hashApiKey(apiKey);
      const hash2 = hashApiKey(apiKey);

      // Bcrypt generates different salts each time
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty API key', () => {
      const hashed = hashApiKey('');
      
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
    });

    it('should handle special characters in API key', () => {
      const specialKey = 'api-key-!@#$%^&*()';
      const hashed = hashApiKey(specialKey);

      expect(hashed).toBeDefined();
    });
  });
});

describe('Security Utils - JWT Token Generation', () => {
  describe('generateJWTToken', () => {
    const validPayload: JWTPayload = {
      id: 123,
      email: 'test@example.com'
    };

    it('should generate a valid JWT token', () => {
      const token = generateJWTToken(validPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // JWT format: header.payload.signature
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should include payload data in token', () => {
      const payload: JWTPayload = {
        id: 456,
        email: 'user@test.com'
      };

      const token = generateJWTToken(payload);
      const decoded = jwt.decode(token) as JWTPayload;

      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
    });

    it('should set expiration time', () => {
      const token = generateJWTToken(validPayload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
      
      // Token should expire in the future
      const now = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeGreaterThan(now);
    });

    it('should be verifiable with correct secret', () => {
      const token = generateJWTToken(validPayload);
      const secret = process.env.ACCESS_TOKEN_SECRET!;

      expect(() => {
        jwt.verify(token, secret);
      }).not.toThrow();
    });

    it('should fail verification with wrong secret', () => {
      const token = generateJWTToken(validPayload);
      const wrongSecret = 'wrong-secret-key';

      expect(() => {
        jwt.verify(token, wrongSecret);
      }).toThrow();
    });

    it('should throw error if JWT secret is not defined', () => {
      const originalSecret = process.env.ACCESS_TOKEN_SECRET;
      delete process.env.ACCESS_TOKEN_SECRET;

      expect(() => {
        generateJWTToken(validPayload);
      }).toThrow('JWT secret key is not defined');

      // Restore secret
      process.env.ACCESS_TOKEN_SECRET = originalSecret;
    });

    it('should generate different tokens for different payloads', () => {
      const payload1: JWTPayload = { id: 1, email: 'user1@test.com' };
      const payload2: JWTPayload = { id: 2, email: 'user2@test.com' };

      const token1 = generateJWTToken(payload1);
      const token2 = generateJWTToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it('should handle numeric id correctly', () => {
      const payload: JWTPayload = { id: 999, email: 'test@example.com' };
      const token = generateJWTToken(payload);
      const decoded = jwt.decode(token) as JWTPayload;

      expect(typeof decoded.id).toBe('number');
      expect(decoded.id).toBe(999);
    });

    it('should handle email with special characters', () => {
      const payload: JWTPayload = {
        id: 1,
        email: 'user+test@sub-domain.example.com'
      };

      const token = generateJWTToken(payload);
      const decoded = jwt.decode(token) as JWTPayload;

      expect(decoded.email).toBe(payload.email);
    });
  });
});

describe('Security Utils - Integration Tests', () => {
  it('should support full password lifecycle', () => {
    const originalPassword = 'UserPassword123!';
    
    // 1. Hash password
    const { hashedPassword, salt } = hashPassword(originalPassword);
    
    // 2. Verify correct password
    const isValid = comparePassword(originalPassword, hashedPassword, salt);
    expect(isValid).toBe(true);
    
    // 3. Reject wrong password
    const isInvalid = comparePassword('WrongPassword456!', hashedPassword, salt);
    expect(isInvalid).toBe(false);
  });

  it('should support full API key lifecycle', () => {
    // 1. Generate API key
    const apiKey = generateApiKey();
    expect(apiKey).toBeDefined();
    
    // 2. Hash API key for storage
    const hashedKey = hashApiKey(apiKey);
    expect(hashedKey).toBeDefined();
    expect(hashedKey).not.toBe(apiKey);
  });

  it('should support full JWT lifecycle', () => {
    const payload: JWTPayload = { id: 789, email: 'jwt@test.com' };
    const secret = process.env.ACCESS_TOKEN_SECRET!;
    
    // 1. Generate token
    const token = generateJWTToken(payload);
    expect(token).toBeDefined();
    
    // 2. Verify and decode token
    const decoded = jwt.verify(token, secret) as JWTPayload;
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
  });
});
