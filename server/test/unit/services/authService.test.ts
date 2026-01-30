/**
 * Unit tests for AuthService
 * Tests tenant registration, login, and authentication logic
 */
import {jest, describe, it, expect, beforeEach, afterEach} from '@jest/globals';
import { AuthService } from '../../../src/modules/tenant/services/AuthService';
import { MockTenantRepository } from '../../mocks/mockTenantRepository';
import { TenantRegisterInput, TenantLoginInput } from '../../../src/modules/tenant/zodSchema';
import { Tenant } from '../../../src/modules/tenant/schema';
import { randomEmail, generateStrongPassword } from '../../helpers/testHelpers';
import * as security from '../../../src/utils/security';

// Mock the security utils
jest.mock('../../../src/utils/security');
const mockedSecurity = security as jest.Mocked<typeof security>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockRepository: MockTenantRepository;

  beforeEach(() => {
    mockedSecurity.hashPassword.mockImplementation((password: string) => ({
        hashedPassword: `hashed_${password}`,
        salt: `salt_${password}`,
    }));
    mockedSecurity.comparePassword.mockImplementation((password: string, hashedPassword: string, salt: string) => {
        return hashedPassword === `hashed_${password}` && salt === `salt_${password}`;
    });
    mockedSecurity.generateJWTToken.mockImplementation((payload: any) => `jwt_token_${payload.id}_${payload.email}`);

    mockRepository = new MockTenantRepository();
    authService = new AuthService(mockRepository as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerTenant', () => {
    const validRegisterInput: TenantRegisterInput = {
      name: 'Test Company',
      email: 'test@example.com',
      password: 'StrongPass123!',
    };

    it('should successfully register a new tenant', async () => {
      // Act
      const result = await authService.registerTenant(validRegisterInput);

      // Assert
      expect(result).toBeDefined();
      expect(result.tenant).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.tenant.id).toBeGreaterThan(0);
      expect(result.tenant.name).toBe(validRegisterInput.name);
      expect(result.tenant.email).toBe(validRegisterInput.email);
      expect(result.tenant.status).toBe('active');
    });

    it('should hash the password before storing', async () => {
      // Act
      await authService.registerTenant(validRegisterInput);

      // Assert
      expect(security.hashPassword).toHaveBeenCalledWith(validRegisterInput.password);
      
      // Verify tenant was created with hashed password
      const tenant = await mockRepository.getTenantByEmail(validRegisterInput.email);
      expect(tenant?.password).toBe(`hashed_${validRegisterInput.password}`);
      expect(tenant?.salt).toBe(`salt_${validRegisterInput.password}`);
    });

    it('should generate JWT token with tenant id and email', async () => {
      // Act
      const result = await authService.registerTenant(validRegisterInput);

      // Assert
      expect(security.generateJWTToken).toHaveBeenCalledWith({
        id: result.tenant.id,
        email: result.tenant.email,
      });
      expect(result.token).toContain('jwt_token');
    });

    it('should set tenant status to active by default', async () => {
      // Act
      const result = await authService.registerTenant(validRegisterInput);

      // Assert
      expect(result.tenant.status).toBe('active');
      
      const tenant = await mockRepository.getTenantById(result.tenant.id);
      expect(tenant?.status).toBe('active');
    });

    it('should throw error if tenant already exists with same email', async () => {
      // Arrange - Register first tenant
      await authService.registerTenant(validRegisterInput);

      // Act & Assert
      await expect(
        authService.registerTenant(validRegisterInput)
      ).rejects.toThrow('Tenant already exists with this email');
    });

    it('should perform case-sensitive email check for duplicates', async () => {
      // Arrange
      await authService.registerTenant({
        ...validRegisterInput,
        email: 'test@example.com',
      });

      // Act - Try with different case (should succeed if case-sensitive)
      const result = await authService.registerTenant({
        ...validRegisterInput,
        email: 'TEST@EXAMPLE.COM',
      });

      // Assert - Should create new tenant (case-sensitive)
      expect(result.tenant.email).toBe('TEST@EXAMPLE.COM');
    });

    it('should not return password or salt in response', async () => {
      // Act
      const result = await authService.registerTenant(validRegisterInput);

      // Assert
      expect(result.tenant).not.toHaveProperty('password');
      expect(result.tenant).not.toHaveProperty('salt');
    });

    it('should set created_at and updated_at timestamps', async () => {
      // Act
      const result = await authService.registerTenant(validRegisterInput);

      // Assert
      expect(result.tenant.created_at).toBeDefined();
      expect(result.tenant.updated_at).toBeDefined();
      expect(new Date(result.tenant.created_at).getTime()).toBeGreaterThan(0);
    });

    it('should handle multiple tenant registrations', async () => {
      // Arrange
      const tenant1: TenantRegisterInput = {
        name: 'Company 1',
        email: randomEmail(),
        password: 'Password123!',
      };
      const tenant2: TenantRegisterInput = {
        name: 'Company 2',
        email: randomEmail(),
        password: 'Password456!',
      };

      // Act
      const result1 = await authService.registerTenant(tenant1);
      const result2 = await authService.registerTenant(tenant2);

      // Assert
      expect(result1.tenant.id).not.toBe(result2.tenant.id);
      expect(result1.tenant.email).toBe(tenant1.email);
      expect(result2.tenant.email).toBe(tenant2.email);
    });
  });

  describe('loginTenant', () => {
    const password = 'StrongPass123!';
    const email = 'login@example.com';
    let registeredTenant: Tenant;

    beforeEach(async () => {
      // Register a tenant for login tests
      const registerInput: TenantRegisterInput = {
        name: 'Test Company',
        email,
        password,
      };
      const result = await authService.registerTenant(registerInput);
      registeredTenant = await mockRepository.getTenantById(result.tenant.id) as Tenant;
    });

    it('should successfully login with correct credentials', async () => {
      // Arrange
      const loginInput: TenantLoginInput = {
        email,
        password,
      };

      // Act
      const result = await authService.loginTenant(loginInput);

      // Assert
      expect(result).toBeDefined();
      expect(result.tenant).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.tenant.email).toBe(email);
    });

    it('should verify password using comparePassword', async () => {
      // Arrange
      const loginInput: TenantLoginInput = { email, password };

      // Act
      await authService.loginTenant(loginInput);

      // Assert
      expect(security.comparePassword).toHaveBeenCalledWith(
        password,
        registeredTenant.password,
        registeredTenant.salt
      );
    });

    it('should generate JWT token on successful login', async () => {
      // Arrange
      const loginInput: TenantLoginInput = { email, password };

      // Act
      const result = await authService.loginTenant(loginInput);

      // Assert
      expect(security.generateJWTToken).toHaveBeenCalledWith({
        id: registeredTenant.id,
        email: registeredTenant.email,
      });
      expect(result.token).toContain('jwt_token');
    });

    it('should throw error with invalid email', async () => {
      // Arrange
      const loginInput: TenantLoginInput = {
        email: 'nonexistent@example.com',
        password,
      };

      // Act & Assert
      await expect(
        authService.loginTenant(loginInput)
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error with incorrect password', async () => {
      // Arrange
      const loginInput: TenantLoginInput = {
        email,
        password: 'WrongPassword123!',
      };

      // Act & Assert
      await expect(
        authService.loginTenant(loginInput)
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if tenant status is inactive', async () => {
      // Arrange - Update tenant to inactive
      await mockRepository.updateTenant(registeredTenant.id, { status: 'inactive' });
      const loginInput: TenantLoginInput = { email, password };

      // Act & Assert
      await expect(
        authService.loginTenant(loginInput)
      ).rejects.toThrow('Tenant account is not active');
    });

    it('should throw error if tenant status is suspended', async () => {
      // Arrange - Update tenant to suspended
      await mockRepository.updateTenant(registeredTenant.id, { status: 'suspended' });
      const loginInput: TenantLoginInput = { email, password };

      // Act & Assert
      await expect(
        authService.loginTenant(loginInput)
      ).rejects.toThrow('Tenant account is not active');
    });

    it('should allow login only for active tenants', async () => {
      // Arrange - Ensure tenant is active
      await mockRepository.updateTenant(registeredTenant.id, { status: 'active' });
      const loginInput: TenantLoginInput = { email, password };

      // Act
      const result = await authService.loginTenant(loginInput);

      // Assert
      expect(result.tenant.status).toBe('active');
    });

    it('should not return password or salt in login response', async () => {
      // Arrange
      const loginInput: TenantLoginInput = { email, password };

      // Act
      const result = await authService.loginTenant(loginInput);

      // Assert
      expect(result.tenant).not.toHaveProperty('password');
      expect(result.tenant).not.toHaveProperty('salt');
    });

    it('should return same tenant data as registration', async () => {
      // Arrange
      const loginInput: TenantLoginInput = { email, password };

      // Act
      const result = await authService.loginTenant(loginInput);

      // Assert
      expect(result.tenant.id).toBe(registeredTenant.id);
      expect(result.tenant.name).toBe(registeredTenant.name);
      expect(result.tenant.email).toBe(registeredTenant.email);
      expect(result.tenant.status).toBe(registeredTenant.status);
    });
  });

  describe('sanitizeTenantResponse', () => {
    it('should remove password and salt from tenant object', async () => {
      // Arrange - Register a tenant
      const registerInput: TenantRegisterInput = {
        name: 'Test Company',
        email: randomEmail(),
        password: 'Password123!',
      };

      // Act
      const result = await authService.registerTenant(registerInput);

      // Assert - Response should not have password/salt
      expect(result.tenant).not.toHaveProperty('password');
      expect(result.tenant).not.toHaveProperty('salt');
    });

    it('should include all public fields', async () => {
      // Arrange
      const registerInput: TenantRegisterInput = {
        name: 'Test Company',
        email: randomEmail(),
        password: 'Password123!',
      };

      // Act
      const result = await authService.registerTenant(registerInput);

      // Assert
      expect(result.tenant).toHaveProperty('id');
      expect(result.tenant).toHaveProperty('name');
      expect(result.tenant).toHaveProperty('email');
      expect(result.tenant).toHaveProperty('status');
      expect(result.tenant).toHaveProperty('created_at');
      expect(result.tenant).toHaveProperty('updated_at');
    });

    it('should work consistently for both register and login', async () => {
      // Arrange
      const email = randomEmail();
      const password = 'Password123!';
      
      const registerInput: TenantRegisterInput = {
        name: 'Test Company',
        email,
        password,
      };

      // Act
      const registerResult = await authService.registerTenant(registerInput);
      const loginResult = await authService.loginTenant({ email, password });

      // Assert - Both responses should have same structure
      expect(Object.keys(registerResult.tenant).sort()).toEqual(
        Object.keys(loginResult.tenant).sort()
      );
      expect(registerResult.tenant).not.toHaveProperty('password');
      expect(loginResult.tenant).not.toHaveProperty('password');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete registration -> login flow', async () => {
      // Register
      const email = randomEmail();
      const password = generateStrongPassword();
      const registerResult = await authService.registerTenant({
        name: 'Integration Test Company',
        email,
        password,
      });

      expect(registerResult.tenant.email).toBe(email);
      expect(registerResult.token).toBeDefined();

      // Login
      const loginResult = await authService.loginTenant({ email, password });

      expect(loginResult.tenant.id).toBe(registerResult.tenant.id);
      expect(loginResult.tenant.email).toBe(email);
      expect(loginResult.token).toBeDefined();
    });

    it('should prevent duplicate registrations', async () => {
      // Arrange
      const email = randomEmail();
      const registerInput: TenantRegisterInput = {
        name: 'Duplicate Test',
        email,
        password: 'Password123!',
      };

      // Act - First registration succeeds
      await authService.registerTenant(registerInput);

      // Assert - Second registration fails
      await expect(
        authService.registerTenant(registerInput)
      ).rejects.toThrow('Tenant already exists with this email');
    });

    it('should handle tenant status changes affecting login', async () => {
      // Arrange - Register and get tenant
      const email = randomEmail();
      const password = 'Password123!';
      const registerResult = await authService.registerTenant({
        name: 'Status Test Company',
        email,
        password,
      });

      // Act - Login should work initially
      await expect(
        authService.loginTenant({ email, password })
      ).resolves.toBeDefined();

      // Suspend tenant
      await mockRepository.updateTenant(registerResult.tenant.id, { status: 'suspended' });

      // Assert - Login should fail after suspension
      await expect(
        authService.loginTenant({ email, password })
      ).rejects.toThrow('Tenant account is not active');
    });

    it('should maintain separate sessions for multiple tenants', async () => {
      // Arrange - Register two tenants
      const email1 = randomEmail();
      const email2 = randomEmail();
      const password1 = 'Password123!';
      const password2 = 'Password456!';

      const tenant1 = await authService.registerTenant({
        name: 'Company 1',
        email: email1,
        password: password1,
      });

      const tenant2 = await authService.registerTenant({
        name: 'Company 2',
        email: email2,
        password: password2,
      });

      // Act - Both should be able to login independently
      const login1 = await authService.loginTenant({ email: email1, password: password1 });
      const login2 = await authService.loginTenant({ email: email2, password: password2 });

      // Assert
      expect(login1.tenant.id).toBe(tenant1.tenant.id);
      expect(login2.tenant.id).toBe(tenant2.tenant.id);
      expect(login1.token).not.toBe(login2.token);
    });
  });
});
