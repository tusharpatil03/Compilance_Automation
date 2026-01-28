import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../../../utils/security";

/**
 * Extended Request interface to include authenticated tenant data
 */
export interface AuthenticatedRequest extends Request {
    tenant?: JWTPayload;
}

/**
 * Middleware to authenticate tenant using JWT token
 * Validates Bearer token from Authorization header
 * 
 * Usage: Apply to protected routes that require tenant authentication
 * Example: router.get("/api-keys", authenticateTenant, getApiKeys);
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
            res.status(401).json({
                success: false,
                message: "Authorization token required",
            });
            return;
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Get JWT secret from environment
        const secretKey = process.env.ACESS_TOKEN_SECRET;
        
        if (!secretKey) {
            console.error("JWT secret key is not defined in environment variables");
            res.status(500).json({
                success: false,
                message: "Server configuration error",
            });
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
            res.status(401).json({
                success: false,
                message: "Token has expired",
            });
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: "Invalid token",
            });
            return;
        }

        console.error("Error in authenticateTenant middleware:", error);
        res.status(500).json({
            success: false,
            message: "Authentication error",
        });
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
        res.status(401).json({
            success: false,
            message: "Authentication required",
        });
        return;
    }

    // Additional status checks can be added here by querying the database
    // For now, we assume the token is valid = tenant is active
    next();
};
