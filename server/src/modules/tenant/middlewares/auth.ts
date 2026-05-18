import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../../../utils/security";
import { sendErrorResponse, ApiError } from "../../../utils/errorHandler";
import { ErrorCode } from "../../../utils/APIContract";

// extended Request interface to include authenticated tenant data
export interface AuthenticatedRequest extends Request {
    tenant?: JWTPayload;
}

/**
 * Middleware to authenticate tenant using JWT token
 * Validates Bearer token from Authorization header
 */
export const authenticateTenant = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            sendErrorResponse(res, new ApiError(ErrorCode.AUTH_REQUIRED, "Authentication required", 401));
            return;
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Get JWT secret from environment
        const secretKey = process.env.ACCESS_TOKEN_SECRET;
        
        if (!secretKey) {
            console.error("JWT secret key is not defined in environment variables");
            sendErrorResponse(res, new ApiError(ErrorCode.INTERNAL_ERROR, "Server configuration error", 500));
            return;
        }

        // Verify and decode token
        const decoded = jwt.verify(token, secretKey) as JWTPayload;

        // Attach tenant data to request for downstream handlers
        req.tenant = decoded;

        // Proceed to next middleware/handler
        next();
    } catch (error) {
        // Handle specific JWT errors
        if (error instanceof jwt.TokenExpiredError) {
            sendErrorResponse(res, new ApiError(ErrorCode.TOKEN_EXPIRED, "Token has expired. Please login again", 401));
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            sendErrorResponse(res, new ApiError(ErrorCode.INVALID_TOKEN, "Invalid or malformed token", 401));
            return;
        }

        console.error("Error in authenticateTenant middleware:", error);
        sendErrorResponse(res, new ApiError(ErrorCode.INTERNAL_ERROR, "Authentication error", 500));
    }
};

/**
 * Optional middleware to check if tenant has specific status
 * Use after authenticateTenant middleware
 */
export const requireActiveTenant = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.tenant) {
        sendErrorResponse(res, new ApiError(ErrorCode.AUTH_REQUIRED, "Authentication required", 401));
        return;
    }
    next();
};
