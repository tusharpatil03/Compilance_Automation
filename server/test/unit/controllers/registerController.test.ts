/**
 * Unit tests for Register Controller
 * Tests HTTP request/response handling for tenant registration
 */
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { registerTenant } from "../../../src/modules/tenant/controllers/register";
import { AuthService } from "../../../src/modules/tenant/services/AuthService";
import { TenantRepository } from "../../../src/modules/tenant/respository";
import { randomEmail, generateStrongPassword } from "../../helpers/testHelpers";

// Mock the database connection
jest.mock("../../../src/db/connection", () => ({
    db: {},
}));

// Mock AuthService
jest.mock("../../../src/modules/tenant/services/AuthService");
jest.mock("../../../src/modules/tenant/respository");

describe("Register Controller", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    let mockTenantResponse = {
        id: 1,
        name: "Test Company",
        email: "example@gmail.com",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    type RegisterResult = {
        tenant: typeof mockTenantResponse
        token: string
    }

    const mockRegister = jest.fn() as jest.Mock<any>;

    beforeEach(() => {
        (AuthService as jest.Mock).mockImplementation(() => ({
            registerTenant: mockRegister,
        }));

        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });

        mockRequest = {
            body: {
                name: "Acme",
                email: "a@b.com",
                password: "secret"
            }
        } as Request;

        mockResponse = {
            status: mockStatus,
            json: mockJson,
        } as unknown as Response;

        jest.clearAllMocks();
    });

    describe("Success scenarios", () => {
        it("should register tenant and return 201 with tenant data and token", async () => {
            // Arrange
            const email = randomEmail();
            const password = generateStrongPassword();

            mockRequest.body = {
                name: "Test Company",
                email,
                password,
            };

            mockTenantResponse = {
                id: 1,
                name: "Test Company",
                email,
                status: "active",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const mockToken = "jwt_token_xyz";

            // const mockRegister = registerTenant as jest.MockedFunction<typeof registerTenant>;

            mockRegister.mockResolvedValue({
                tenant: mockTenantResponse,
                token: mockToken,
            });

            //jest.fn<()=> Promise<{tenant:typeof mockTenantResponse, token: typeof mockToken}>>()

            (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
                () =>
                    ({
                        registerTenant: mockRegister,
                    }) as any,
            );

            // Act
            await registerTenant(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith({
                success: true,
                message: "Tenant registered successfully",
                data: {
                    tenant: mockTenantResponse,
                    auth: {
                        accessToken: mockToken,
                        tokenType: "Bearer",
                        expiresIn: "1h",
                    },
                },
            });
        });

        it("should call AuthService.registerTenant with correct parameters", async () => {
            // Arrange
            const email = randomEmail();
            const password = "ValidPass123!";
            const name = "Test Company";

            mockRequest.body = { name, email, password };

            mockRegister.mockResolvedValue({
                tenant: {
                    id: 1,
                    name,
                    email,
                    status: "active",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                token: "token",
            });

            (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
                () =>
                    ({
                        registerTenant: mockRegister,
                    }) as any,
            );

            // Act
            await registerTenant(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockRegister).toHaveBeenCalledWith({
                name,
                email,
                password,
            });
        });

        it("should return tenant without password or salt", async () => {
            // Arrange
            mockRequest.body = {
                name: "Test Company",
                email: randomEmail(),
                password: "Password123!",
            };

            const mockTenantResponse = {
                id: 1,
                name: "Test Company",
                email: mockRequest.body.email,
                status: "active",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            mockRegister.mockResolvedValue({
                tenant: mockTenantResponse,
                token: "token",
            });

            (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
                () =>
                    ({
                        registerTenant: mockRegister,
                    }) as any,
            );

            // Act
            await registerTenant(mockRequest as Request, mockResponse as Response);

            // Assert
            const responseData = (mockJson.mock.calls[0]![0]! as any).data.tenant;
            expect(responseData).not.toHaveProperty("password");
            expect(responseData).not.toHaveProperty("salt");
        });

        it("should include auth object with accessToken, tokenType, and expiresIn", async () => {
            // Arrange
            mockRequest.body = {
                name: "Test Company",
                email: randomEmail(),
                password: "Password123!",
            };

            mockRegister.mockResolvedValue({
                tenant: {
                    id: 1,
                    name: "Test Company",
                    email: mockRequest.body.email,
                    status: "active",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                token: "jwt_token_abc",
            });

            (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
                () =>
                    ({
                        registerTenant: mockRegister,
                    }) as any,
            );

            // Act
            await registerTenant(mockRequest as Request, mockResponse as Response);

            // Assert
            const responseData = (mockJson.mock.calls[0]![0]! as any).data;
            expect(responseData.auth).toEqual({
                accessToken: "jwt_token_abc",
                tokenType: "Bearer",
                expiresIn: "1h",
            });
        });
    });

    describe("Error scenarios", () => {
        it("should return 409 when tenant already exists", async () => {
            // Arrange
            mockRequest.body = {
                name: "Test Company",
                email: "existing@example.com",
                password: "Password123!",
            };

            const mockRegister = jest.fn() as jest.Mock<any>;
            mockRegister.mockRejectedValue(new Error("Tenant already exists with this email"));

            (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
                () =>
                    ({
                        registerTenant: mockRegister,
                    }) as any,
            );

            // Act
            await registerTenant(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(409);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                message: "Tenant already exists with this email",
            });
        });

        it("should return 500 for general errors", async () => {
            // Arrange
            mockRequest.body = {
                name: "Test Company",
                email: randomEmail(),
                password: "Password123!",
            };

            const mockRegister = jest.fn() as jest.Mock<any>;
            mockRegister.mockRejectedValue(new Error("Database connection failed"));

            (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
                () =>
                    ({
                        registerTenant: mockRegister,
                    }) as any,
            );

            // Act
            await registerTenant(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                message: "Error registering tenant",
                error: "Database connection failed",
            });
        });

        it("should handle non-Error exceptions", async () => {
            // Arrange
            mockRequest.body = {
                name: "Test Company",
                email: randomEmail(),
                password: "Password123!",
            };

            const mockRegister = jest.fn() as jest.Mock<any>;
            mockRegister.mockRejectedValue("String error");

            (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
                () =>
                    ({
                        registerTenant: mockRegister,
                    }) as any,
            );

            // Act
            await registerTenant(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                message: "Error registering tenant",
                error: "String error",
            });
        });

        it("should log errors to console", async () => {
            // Arrange
            const consoleErrorSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => { });

            mockRequest.body = {
                name: "Test Company",
                email: randomEmail(),
                password: "Password123!",
            };

            const error = new Error("Test error");
            mockRegister.mockRejectedValue(error);

            (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
                () =>
                    ({
                        registerTenant: mockRegister,
                    }) as any,
            );

            // Act
            await registerTenant(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error in registerTenant controller:",
                error,
            );

            consoleErrorSpy.mockRestore();
        });
    });

    describe("Response structure validation", () => {
        it("should always include success field in response", async () => {
            // Arrange
            mockRequest.body = {
                name: "Test Company",
                email: randomEmail(),
                password: "Password123!",
            };

            mockRegister.mockResolvedValue({
                tenant: {
                    id: 1,
                    name: "Test Company",
                    email: mockRequest.body.email,
                    status: "active",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                token: "token",
            });

            (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
                () =>
                    ({
                        registerTenant: mockRegister,
                    }) as any,
            );

            // Act
            await registerTenant(mockRequest as Request, mockResponse as Response);

            // Assert
            const response = mockJson.mock.calls[0]![0]! as any;
            expect(response).toHaveProperty("success");
            expect(typeof response.success).toBe("boolean");
        });

        it("should always include message field in response", async () => {
            // Arrange
            mockRequest.body = {
                name: "Test Company",
                email: randomEmail(),
                password: "Password123!",
            };

            mockRegister.mockResolvedValue({
                tenant: {
                    id: 1,
                    name: "Test Company",
                    email: mockRequest.body.email,
                    status: "active",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                token: "token",
            });

            (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
                () =>
                    ({
                        registerTenant: mockRegister,
                    }) as any,
            );

            // Act
            await registerTenant(mockRequest as Request, mockResponse as Response);

            // Assert
            const response = mockJson.mock.calls[0]![0]! as any;
            expect(response).toHaveProperty("message");
            expect(typeof response.message).toBe("string");
        });

        it("should include data field with tenant and auth on success", async () => {
            // Arrange
            mockRequest.body = {
                name: "Test Company",
                email: randomEmail(),
                password: "Password123!",
            };

            mockRegister.mockResolvedValue({
                tenant: {
                    id: 1,
                    name: "Test Company",
                    email: mockRequest.body.email,
                    status: "active",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                token: "token",
            });

            (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
                () =>
                    ({
                        registerTenant: mockRegister,
                    }) as any,
            );

            // Act
            await registerTenant(mockRequest as Request, mockResponse as Response);

            // Assert
            const response = mockJson.mock.calls[0]![0]! as any;
            expect(response).toHaveProperty("data");
            expect(response.data).toHaveProperty("tenant");
            expect(response.data).toHaveProperty("auth");
        });
    });

    describe("Integration with repository and service", () => {
        it("should initialize TenantRepository with db connection", async () => {
            // Arrange
            mockRequest.body = {
                name: "Test Company",
                email: randomEmail(),
                password: "Password123!",
            };

            mockRegister.mockResolvedValue({
                tenant: {
                    id: 1,
                    name: "Test Company",
                    email: mockRequest.body.email,
                    status: "active",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                token: "token",
            });

            (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(
                () =>
                    ({
                        registerTenant: mockRegister,
                    }) as any,
            );

            // Act
            await registerTenant(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(TenantRepository).toHaveBeenCalled();
            expect(AuthService).toHaveBeenCalled();
        });
    });
});
