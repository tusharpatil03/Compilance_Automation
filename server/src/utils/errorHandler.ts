import { Response } from "express";
import {
    ErrorCode,
    ErrorResponse,
    SuccessResponse,
    getErrorType,
    Pagination,
    ValidationIssue,
} from "./APIContract";

export class ApiError extends Error {
    public readonly code: ErrorCode; 
    public readonly httpStatus: number;
    public readonly field?: string; 
    public readonly issues?: ValidationIssue[];

    constructor(
        code: ErrorCode,
        message: string,
        httpStatus: number = 400,
        field?: string,
        issues?: ValidationIssue[],
    ) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
        this.field = field;
        this.issues = issues;
    }
}

export const sendErrorResponse = (
    res: Response,
    error: ApiError | Error,
): Response => {
    const isApiError = error instanceof ApiError;
    const code = isApiError ? error.code : ErrorCode.INTERNAL_ERROR;
    const httpStatus = isApiError ? error.httpStatus : 500;

    const body: ErrorResponse = {
        success: false,
        status: httpStatus,
        message: error.message || "An unexpected error occurred",
        error: {
            type: getErrorType(code),
            code,
            ...(isApiError && error.field ? { field: error.field } : {}),
            ...(isApiError && error.issues?.length ? { issues: error.issues } : {}),
        },
    };

    return res.status(httpStatus).json(body);
};

export const sendSuccessResponse = <T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
    pagination?: Pagination,
): Response => {
    const body: SuccessResponse<T> = {
        success: true,
        status: statusCode,
        message,
        data,
        ...(pagination ? { pagination } : {}),
    };

    return res.status(statusCode).json(body);
};