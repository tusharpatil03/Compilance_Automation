import { Response } from "express";

// Error codes for API responses
export enum ErrorCode {
    // Authentication errors (4xx)
    AUTH_REQUIRED = "ERR_401_AUTH_REQUIRED",
    INVALID_TOKEN = "ERR_401_INVALID_TOKEN",
    TOKEN_EXPIRED = "ERR_401_TOKEN_EXPIRED",

    // Validation errors (4xx)
    VALIDATION_ERROR = "ERR_400_VALIDATION_ERROR",
    INVALID_EMAIL = "ERR_400_INVALID_EMAIL",
    INVALID_PASSWORD = "ERR_400_INVALID_PASSWORD",
    INVALID_URL = "ERR_400_INVALID_URL",
    INVALID_TIMESTAMP = "ERR_400_INVALID_TIMESTAMP",
    INVALID_ID = "ERR_400_INVALID_ID",
    MISSING_REQUIRED_FIELD = "ERR_400_MISSING_FIELD",

    // Authorization errors (4xx)
    FORBIDDEN = "ERR_403_FORBIDDEN",
    INSUFFICIENT_PERMISSIONS = "ERR_403_INSUFFICIENT_PERMISSIONS",
    KEY_DOES_NOT_BELONG_TO_TENANT = "ERR_403_KEY_DOES_NOT_BELONG",

    // Not found errors (4xx)
    NOT_FOUND = "ERR_404_NOT_FOUND",
    TENANT_NOT_FOUND = "ERR_404_TENANT_NOT_FOUND",
    API_KEY_NOT_FOUND = "ERR_404_API_KEY_NOT_FOUND",
    WEBHOOK_NOT_FOUND = "ERR_404_WEBHOOK_NOT_FOUND",

    // Conflict errors (4xx)
    CONFLICT = "ERR_409_CONFLICT",
    TENANT_ALREADY_EXISTS = "ERR_409_TENANT_EXISTS",
    KEY_ALREADY_EXISTS = "ERR_409_KEY_EXISTS",
    WEBHOOK_ALREADY_EXISTS = "ERR_409_WEBHOOK_EXISTS",
    DUPLICATE_EMAIL = "ERR_409_DUPLICATE_EMAIL",

    // Server errors (5xx)
    INTERNAL_ERROR = "ERR_500_INTERNAL_ERROR",
    DATABASE_ERROR = "ERR_500_DATABASE_ERROR",
    ENCRYPTION_ERROR = "ERR_500_ENCRYPTION_ERROR",
}

interface ErrorResponse {
    success: false;
    message: string;
    code: ErrorCode;
    errors?: Record<string, any>;
    statusCode: number;
}

interface SuccessResponse<T = any> {
    success: true;
    message: string;
    data?: T;
    pagination?: {
        limit: number;
        offset: number;
        total: number;
    };
}

/**
 * Standardized error response formatter
 */
export class ApiError extends Error {
    constructor(
        public code: ErrorCode,
        message: string,
        public statusCode: number = 400,
        public errors?: Record<string, any>
    ) {
        super(message);
        this.name = "ApiError";
    }

    toResponse(): ErrorResponse {
        return {
            success: false,
            message: this.message,
            code: this.code,
            errors: this.errors,
            statusCode: this.statusCode,
        };
    }
}

/**
 * Send standardized error response
 */
export const sendErrorResponse = (
    res: Response,
    error: ApiError | Error,
    defaultStatus: number = 400
): Response => {
    if (error instanceof ApiError) {
        const { statusCode, ...response } = error.toResponse();
        return res.status(statusCode).json(response);
    }

    // Handle unexpected errors
    return res.status(defaultStatus).json({
        success: false,
        message: error.message || "An unexpected error occurred",
        code: ErrorCode.INTERNAL_ERROR,
    });
};

/**
 * Send standardized success response
 */
export const sendSuccessResponse = <T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
    pagination?: { limit: number; offset: number; total: number }
): Response => {
    const response: SuccessResponse<T> = {
        success: true,
        message,
    };

    if (data !== undefined) {
        response.data = data;
    }

    if (pagination) {
        response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
};

/**
 * Error factory functions for common errors
 */
export const Errors = {
    authRequired: () =>
        new ApiError(
            ErrorCode.AUTH_REQUIRED,
            "Authentication required",
            401
        ),

    invalidToken: () =>
        new ApiError(
            ErrorCode.INVALID_TOKEN,
            "Invalid or malformed token",
            401
        ),

    tokenExpired: () =>
        new ApiError(
            ErrorCode.TOKEN_EXPIRED,
            "Token has expired. Please login again",
            401
        ),

    validationError: (message: string, errors?: Record<string, any>) =>
        new ApiError(
            ErrorCode.VALIDATION_ERROR,
            message,
            400,
            errors
        ),

    invalidEmail: (email: string) =>
        new ApiError(
            ErrorCode.INVALID_EMAIL,
            `Invalid email address: ${email}`,
            400
        ),

    invalidPassword: () =>
        new ApiError(
            ErrorCode.INVALID_PASSWORD,
            "Password must contain at least one uppercase letter, one number, and one special character (!@#$%^&*)",
            400
        ),

    invalidUrl: (url: string) =>
        new ApiError(
            ErrorCode.INVALID_URL,
            `Invalid URL: ${url}. URL must use HTTPS protocol`,
            400
        ),

    invalidTimestamp: (timestamp: string) =>
        new ApiError(
            ErrorCode.INVALID_TIMESTAMP,
            `Invalid timestamp format: ${timestamp}. Expected ISO 8601 format (e.g., 2026-12-31T23:59:59Z)`,
            400
        ),

    invalidId: (id: string, field: string = "ID") =>
        new ApiError(
            ErrorCode.INVALID_ID,
            `Invalid ${field}: ${id}. Must be a valid number`,
            400
        ),

    missingRequired: (field: string) =>
        new ApiError(
            ErrorCode.MISSING_REQUIRED_FIELD,
            `Missing required field: ${field}`,
            400
        ),

    forbidden: (message: string = "Access denied") =>
        new ApiError(
            ErrorCode.FORBIDDEN,
            message,
            403
        ),

    insufficientPermissions: () =>
        new ApiError(
            ErrorCode.INSUFFICIENT_PERMISSIONS,
            "You do not have permission to perform this action",
            403
        ),

    keyDoesNotBelong: () =>
        new ApiError(
            ErrorCode.KEY_DOES_NOT_BELONG_TO_TENANT,
            "This key does not belong to your tenant",
            403
        ),

    notFound: (resource: string = "Resource") =>
        new ApiError(
            ErrorCode.NOT_FOUND,
            `${resource} not found`,
            404
        ),

    tenantNotFound: (id?: number) =>
        new ApiError(
            ErrorCode.TENANT_NOT_FOUND,
            `Tenant ${id ? `with ID ${id}` : ""} not found`,
            404
        ),

    apiKeyNotFound: (kid?: string) =>
        new ApiError(
            ErrorCode.API_KEY_NOT_FOUND,
            `API key ${kid ? `'${kid}'` : ""} not found`,
            404
        ),

    webhookNotFound: () =>
        new ApiError(
            ErrorCode.WEBHOOK_NOT_FOUND,
            "Webhook not found",
            404
        ),

    conflict: (message: string) =>
        new ApiError(
            ErrorCode.CONFLICT,
            message,
            409
        ),

    tenantAlreadyExists: (email: string) =>
        new ApiError(
            ErrorCode.TENANT_ALREADY_EXISTS,
            `Tenant with email '${email}' already exists`,
            409
        ),

    keyAlreadyExists: (kid: string) =>
        new ApiError(
            ErrorCode.KEY_ALREADY_EXISTS,
            `API key with ID '${kid}' already exists for this tenant`,
            409
        ),

    webhookAlreadyExists: (url: string) =>
        new ApiError(
            ErrorCode.WEBHOOK_ALREADY_EXISTS,
            `Webhook for URL '${url}' already exists`,
            409
        ),

    duplicateEmail: (email: string) =>
        new ApiError(
            ErrorCode.DUPLICATE_EMAIL,
            `Email '${email}' is already registered`,
            409
        ),

    internalError: (message: string = "An internal server error occurred") =>
        new ApiError(
            ErrorCode.INTERNAL_ERROR,
            message,
            500
        ),

    databaseError: () =>
        new ApiError(
            ErrorCode.DATABASE_ERROR,
            "Database operation failed",
            500
        ),

    encryptionError: () =>
        new ApiError(
            ErrorCode.ENCRYPTION_ERROR,
            "Failed to process API key encryption",
            500
        ),
};
