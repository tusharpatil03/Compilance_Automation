/**
 * Unit tests for Login Controller
 * Tests HTTP request/response handling for tenant authentication
 */

import { Request, Response } from 'express';
import { loginTenant } from '../../../src/modules/tenant/controllers/login';
import { AuthService } from '../../../src/modules/tenant/services/AuthService';
import { TenantRepository } from '../../../src/modules/tenant/respository';
import { randomEmail, generateStrongPassword } from '../../helpers/testHelpers';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the database connection
jest.mock('../../../src/db/connection', () => ({
  db: {},
}));

// Mock AuthService
jest.mock('../../../src/modules/tenant/services/AuthService');
jest.mock('../../../src/modules/tenant/respository');

describe('Login Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockCookie: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockCookie = jest.fn();

    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: mockStatus as any,
      json: mockJson as any,
      cookie: mockCookie as any,
    };

    jest.clearAllMocks();
  });

  describe('Success scenarios', () => {
    it('should login tenant and return 200 with tenant data and token', async () => {
      // Arrange
      const email = randomEmail();
      const password = generateStrongPassword();

      mockRequest.body = {
        email,
        password,
      };

      const mockTenantResponse = {
        id: 1,
        name: 'Test Company',
        email,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockToken = 'jwt_token_xyz';

      // Mock AuthService.loginTenant
      const mockLoginTenant = (jest.fn() as any).mockResolvedValue({
        tenant: mockTenantResponse,
        token: mockToken,
      });

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        status: 200,
        message: 'Login successful',
        data: {
          tenant: mockTenantResponse,
          auth: {
            accessToken: mockToken,
            tokenType: 'Bearer',
            expiresIn: '1h',
          },
        },
      });
    });

    it('should call AuthService.loginTenant with correct parameters', async () => {
      // Arrange
      const email = randomEmail();
      const password = 'ValidPass123!';

      mockRequest.body = { email, password };

      const mockLoginTenant = (jest.fn() as any).mockResolvedValue({
        tenant: {
          id: 1,
          name: 'Test Company',
          email,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: 'token',
      });

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockLoginTenant).toHaveBeenCalledWith(expect.any(Object), {
        email,
        password,
      });
    });

    it('should return tenant without password or salt', async () => {
      // Arrange
      mockRequest.body = {
        email: randomEmail(),
        password: 'Password123!',
      };

      const mockTenantResponse = {
        id: 1,
        name: 'Test Company',
        email: mockRequest.body.email,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockLoginTenant = (jest.fn() as any).mockResolvedValue({
        tenant: mockTenantResponse,
        token: 'token',
      });

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      const responseData = (mockJson.mock.calls[0]![0]! as any).data.tenant;
      expect(responseData).not.toHaveProperty('password');
      expect(responseData).not.toHaveProperty('salt');
    });

    it('should include auth object with accessToken, tokenType, and expiresIn', async () => {
      // Arrange
      mockRequest.body = {
        email: randomEmail(),
        password: 'Password123!',
      };

      const mockLoginTenant = (jest.fn() as any).mockResolvedValue({
        tenant: {
          id: 1,
          name: 'Test Company',
          email: mockRequest.body.email,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: 'jwt_token_abc',
      });

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      const responseData = (mockJson.mock.calls[0]![0]! as any).data;
      expect(responseData.auth).toEqual({
        accessToken: 'jwt_token_abc',
        tokenType: 'Bearer',
        expiresIn: '1h',
      });
    });
  });

  describe('Error scenarios', () => {
    it('should return 401 for invalid credentials', async () => {
      // Arrange
      mockRequest.body = {
        email: 'user@example.com',
        password: 'WrongPassword123!',
      };

      const mockLoginTenant = (jest.fn() as any).mockRejectedValue(
        new Error('Invalid email or password')
      );

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        status: 401,
        message: 'Invalid email or password',
        error: {
          type: 'AUTH_ERROR',
          code: 'ERR_401_INVALID_CREDENTIALS',
        },
      });
    });

    it('should return 403 for inactive tenant account', async () => {
      // Arrange
      mockRequest.body = {
        email: 'inactive@example.com',
        password: 'Password123!',
      };

      const mockLoginTenant = (jest.fn() as any).mockRejectedValue(
        new Error('Tenant account is not active')
      );

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        status: 403,
        message: 'Tenant account is not active',
        error: {
          type: 'FORBIDDEN',
          code: 'ERR_403_FORBIDDEN',
        },
      });
    });

    it('should return 500 for general errors', async () => {
      // Arrange
      mockRequest.body = {
        email: randomEmail(),
        password: 'Password123!',
      };

      const mockLoginTenant = (jest.fn() as any).mockRejectedValue(
        new Error('Database connection failed')
      );

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        status: 500,
        message: 'Error logging in tenant',
        error: {
          type: 'SERVER_ERROR',
          code: 'ERR_500_INTERNAL_ERROR',
        },
      });
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      mockRequest.body = {
        email: randomEmail(),
        password: 'Password123!',
      };

      const mockLoginTenant = (jest.fn() as any).mockRejectedValue(
        'String error'
      );

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        status: 500,
        message: 'Error logging in tenant',
        error: {
          type: 'SERVER_ERROR',
          code: 'ERR_500_INTERNAL_ERROR',
        },
      });
    });

    it('should log errors to console', async () => {
      // Arrange
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => { });

      mockRequest.body = {
        email: randomEmail(),
        password: 'Password123!',
      };

      const error = new Error('Test error');
      const mockLoginTenant = (jest.fn() as any).mockRejectedValue(error);

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in loginTenant controller:',
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response structure validation', () => {
    it('should always include success field in response', async () => {
      // Arrange
      mockRequest.body = {
        email: randomEmail(),
        password: 'Password123!',
      };

      const mockLoginTenant = (jest.fn() as any).mockResolvedValue({
        tenant: {
          id: 1,
          name: 'Test Company',
          email: mockRequest.body.email,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: 'token',
      });

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      const response = mockJson.mock.calls[0]![0]! as any;
      expect(response).toHaveProperty('success');
      expect(typeof response.success).toBe('boolean');
    });

    it('should always include message field in response', async () => {
      // Arrange
      mockRequest.body = {
        email: randomEmail(),
        password: 'Password123!',
      };

      const mockLoginTenant = (jest.fn() as any).mockResolvedValue({
        tenant: {
          id: 1,
          name: 'Test Company',
          email: mockRequest.body.email,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: 'token',
      });

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      const response = mockJson.mock.calls[0]![0]! as any;
      expect(response).toHaveProperty('message');
      expect(typeof response.message).toBe('string');
    });

    it('should include data field with tenant and auth on success', async () => {
      // Arrange
      mockRequest.body = {
        email: randomEmail(),
        password: 'Password123!',
      };

      const mockLoginTenant = (jest.fn() as any).mockResolvedValue({
        tenant: {
          id: 1,
          name: 'Test Company',
          email: mockRequest.body.email,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: 'token',
      });

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      const response = mockJson.mock.calls[0]![0]! as any;
      expect(response).toHaveProperty('data');
      expect(response.data).toHaveProperty('tenant');
      expect(response.data).toHaveProperty('auth');
    });
  });

  describe('HTTP status codes', () => {
    it('should return 200 for successful login', async () => {
      // Arrange
      mockRequest.body = {
        email: randomEmail(),
        password: 'Password123!',
      };

      const mockLoginTenant = (jest.fn() as any).mockResolvedValue({
        tenant: {
          id: 1,
          name: 'Test Company',
          email: mockRequest.body.email,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: 'token',
      });

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 401 for authentication failure', async () => {
      // Arrange
      mockRequest.body = {
        email: randomEmail(),
        password: 'WrongPassword',
      };

      const mockLoginTenant = (jest.fn() as any).mockRejectedValue(
        new Error('Invalid email or password')
      );

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(401);
    });

    it('should return 403 for account status issues', async () => {
      // Arrange
      mockRequest.body = {
        email: randomEmail(),
        password: 'Password123!',
      };

      const mockLoginTenant = (jest.fn() as any).mockRejectedValue(
        new Error('Account is not active')
      );

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(403);
    });
  });

  describe('Integration with repository and service', () => {
    it('should initialize TenantRepository with db connection', async () => {
      // Arrange
      mockRequest.body = {
        email: randomEmail(),
        password: 'Password123!',
      };

      const mockLoginTenant = (jest.fn() as any).mockResolvedValue({
        tenant: {
          id: 1,
          name: 'Test Company',
          email: mockRequest.body.email,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: 'token',
      });

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(AuthService).toHaveBeenCalled();
      expect(mockLoginTenant).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle missing email in request', async () => {
      // Arrange
      mockRequest.body = {
        password: 'Password123!',
      };

      const mockLoginTenant = (jest.fn() as any).mockRejectedValue(
        new Error('Email is required')
      );

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
    });

    it('should handle missing password in request', async () => {
      // Arrange
      mockRequest.body = {
        email: randomEmail(),
      };

      const mockLoginTenant = (jest.fn() as any).mockRejectedValue(
        new Error('Password is required')
      );

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
    });

    it('should handle empty request body', async () => {
      // Arrange
      mockRequest.body = {};

      const mockLoginTenant = (jest.fn() as any).mockRejectedValue(
        new Error('Email and password are required')
      );

      (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
        () =>
          ({
            loginTenant: mockLoginTenant,
          }) as any
      );

      // Act
      await loginTenant(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });
});
