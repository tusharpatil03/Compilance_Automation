import { Request, Response } from "express";
import { TenantRepository } from "../respository";
import { db } from "../../../db/connection";
import { AuthService } from "../services/AuthService";

/**
 * Login tenant controller
 * Authenticates tenant and returns JWT access token
 */
export const loginTenant = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password } = req.body;

        // Initialize repository and service
        const tenantRepository = new TenantRepository(db);
        const authService = new AuthService(tenantRepository);

        // Authenticate tenant and generate token
        const { tenant, token } = await authService.loginTenant({ email, password });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                tenant,
                auth: {
                    accessToken: token,
                    tokenType: "Bearer",
                    expiresIn: "1h",
                },
            },
        });
    } catch (error) {
        console.error("Error in loginTenant controller:", error);

        // Handle specific error cases
        if (error instanceof Error) {
            if (error.message.includes("Invalid email or password")) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }
            if (error.message.includes("not active")) {
                return res.status(403).json({
                    success: false,
                    message: "Tenant account is suspended or inactive",
                });
            }
        }

        return res.status(500).json({
            success: false,
            message: "Unable to login",
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
