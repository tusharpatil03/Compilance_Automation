// packages/api-contract/src/index.ts
// Both server and client import from here: "@your-org/api-contract"

// ────────────────────────────────────────────────
// Error codes — single source of truth
// ────────────────────────────────────────────────
export enum ErrorCode {
    // 400 Validation
    VALIDATION_ERROR = "ERR_400_VALIDATION_ERROR",
    INVALID_EMAIL = "ERR_400_INVALID_EMAIL",
    INVALID_PASSWORD = "ERR_400_INVALID_PASSWORD",
    INVALID_URL = "ERR_400_INVALID_URL",
    INVALID_TIMESTAMP = "ERR_400_INVALID_TIMESTAMP",
    INVALID_ID = "ERR_400_INVALID_ID",
    MISSING_REQUIRED_FIELD = "ERR_400_MISSING_FIELD",

    // 401 Authentication
    AUTH_REQUIRED = "ERR_401_AUTH_REQUIRED",
    INVALID_TOKEN = "ERR_401_INVALID_TOKEN",
    INVALID_API_KEY = "ERR_401_INVALID_API_KEY",
    INVALID_CREDENTIALS = "ERR_401_INVALID_CREDENTIALS",
    TOKEN_EXPIRED = "ERR_401_TOKEN_EXPIRED",

    // 403 Authorization
    FORBIDDEN = "ERR_403_FORBIDDEN",
    INSUFFICIENT_PERMISSIONS = "ERR_403_INSUFFICIENT_PERMISSIONS",
    KEY_DOES_NOT_BELONG = "ERR_403_KEY_DOES_NOT_BELONG",

    // 404 Not Found
    NOT_FOUND = "ERR_404_NOT_FOUND",
    TENANT_NOT_FOUND = "ERR_404_TENANT_NOT_FOUND",
    API_KEY_NOT_FOUND = "ERR_404_API_KEY_NOT_FOUND",
    WEBHOOK_NOT_FOUND = "ERR_404_WEBHOOK_NOT_FOUND",

    // 409 Conflict
    CONFLICT = "ERR_409_CONFLICT",
    TENANT_ALREADY_EXISTS = "ERR_409_TENANT_EXISTS",
    KEY_ALREADY_EXISTS = "ERR_409_KEY_EXISTS",
    WEBHOOK_ALREADY_EXISTS = "ERR_409_WEBHOOK_EXISTS",
    DUPLICATE_EMAIL = "ERR_409_DUPLICATE_EMAIL",

    // 500 Server
    INTERNAL_ERROR = "ERR_500_INTERNAL_ERROR",
    DATABASE_ERROR = "ERR_500_DATABASE_ERROR",
    ENCRYPTION_ERROR = "ERR_500_ENCRYPTION_ERROR",
}

// ────────────────────────────────────────────────
// Error type — derived from HTTP status prefix
// 401 vs 403 are intentionally separate
// ────────────────────────────────────────────────
export type ErrorType =
    | "VALIDATION_ERROR"   // 400
    | "AUTH_ERROR"         // 401
    | "FORBIDDEN"          // 403
    | "NOT_FOUND"          // 404
    | "CONFLICT"           // 409
    | "SERVER_ERROR";      // 500

export const getErrorType = (code: ErrorCode): ErrorType => {
    if (code.startsWith("ERR_400_")) return "VALIDATION_ERROR";
    if (code.startsWith("ERR_401_")) return "AUTH_ERROR";
    if (code.startsWith("ERR_403_")) return "FORBIDDEN";
    if (code.startsWith("ERR_404_")) return "NOT_FOUND";
    if (code.startsWith("ERR_409_")) return "CONFLICT";
    return "SERVER_ERROR";
};

// ────────────────────────────────────────────────
// Response shapes — discriminated union
// ────────────────────────────────────────────────
export type Pagination = {
    limit: number;
    offset: number;
    count: number;
};

export type ValidationIssue = {
    field: string;
    message: string;
    code?: string;
};

export type SuccessResponse<T> = {
    success: true;
    status: number;
    message: string;
    data?: T;
    pagination?: Pagination;
};

export type ErrorPayload = {
    type: ErrorType;
    code: ErrorCode;   // enum, not string
    field?: string;    // only populated for VALIDATION_ERROR
    issues?: ValidationIssue[];
};

export type ErrorResponse = {
    success: false;
    status: number;
    message: string;
    error: ErrorPayload;
};

export type APIResponse<T> = SuccessResponse<T> | ErrorResponse;