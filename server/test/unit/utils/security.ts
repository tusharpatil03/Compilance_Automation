import {
  hashPassword,
  generateApiKey,
  comparePassword,
  compareApiKeyHash,
  encryptData,
  hashApiKey,
  generateJWTToken,
} from '../../../src/utils/security';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Security Utils', () => {
  describe('hashPassword and comparePassword', () => {
    it('should hash password correctly', async () => {
      const password = 'my_secure_password';
      const { hashedPassword, salt } = hashPassword(password);
      expect(hashedPassword).not.toBe(password);
      expect(salt).toBeDefined();

      const isMatch = await bcrypt.compare(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should compare password correctly', async () => {
      const password = 'another_secure_password';
      const { hashedPassword, salt } = hashPassword(password);
      const isMatch = comparePassword(password, hashedPassword, salt);
      expect(isMatch).toBe(true);

      const isNotMatch = comparePassword(
        'wrong_password',
        hashedPassword,
        salt
      );
      expect(isNotMatch).toBe(false);
    });
  });

  it('should generate 32 bytes api key (64 hex chars)', () => {
    const api_key = generateApiKey();

    expect(api_key).toBeDefined();
    expect(api_key).toBeInstanceOf(String);
    expect(api_key).toHaveLength(64);
  });

  describe('hashApiKey and compareApiKeyHash', () => {
    it('should hash and compare api key correctly', async () => {
      const apiKey = generateApiKey();
      const apiKeyHash = hashApiKey(apiKey);

      const isMatch = await compareApiKeyHash(apiKey, apiKeyHash);
      expect(isMatch).toBe(true);

      const isNotMatch = await compareApiKeyHash('wrong_api_key', apiKeyHash);
      expect(isNotMatch).toBe(false);
    });
  });

  describe('generateJWTToken', () => {
    const originalSecret = process.env.ACCESS_TOKEN_SECRET;

    afterEach(() => {
      process.env.ACCESS_TOKEN_SECRET = originalSecret;
    });

    it('should generate a valid jwt token', () => {
      process.env.ACCESS_TOKEN_SECRET = 'test_jwt_secret';
      const payload = { id: 123, email: 'user@example.com' };

      const token = generateJWTToken(payload);
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as {
        id: number;
        email: string;
      };

      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
    });

    it('should throw when jwt secret is missing', () => {
      delete process.env.ACCESS_TOKEN_SECRET;
      const payload = { id: 1, email: 'missing@secret.com' };

      expect(() => generateJWTToken(payload)).toThrow(
        'JWT secret key is not defined in environment variables'
      );
    });
  });

  describe('encryptData', () => {
    const originalEncryptionSecret = process.env.API_KEY_ENCRYPTION_SECRET;

    beforeEach(() => {
      process.env.API_KEY_ENCRYPTION_SECRET = 'a'.repeat(32);
    });

    afterEach(() => {
      if (originalEncryptionSecret === undefined) {
        delete process.env.API_KEY_ENCRYPTION_SECRET;
      } else {
        process.env.API_KEY_ENCRYPTION_SECRET = originalEncryptionSecret;
      }
    });

    it('should encrypt data with iv prefix', () => {
      const plaintext = 'sensitive_api_key';
      const encrypted = encryptData(plaintext);

      expect(encrypted).toContain(':');
      const [ivHex, cipherHex] = encrypted.split(':');

      expect(ivHex).toHaveLength(32);
      expect(cipherHex.length).toBeGreaterThan(0);
      expect(cipherHex).not.toBe(plaintext);
    });
  });
});
