// register controller for tenant module
import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { DrizzleUnitOfWork } from "../../../repositories/UnitOfWork";
import { db } from "../../../db/connection";

/**
 * Register a new tenant controller
 * Returns tenant data and JWT access token
 */
export const registerTenant = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { name, email, password } = req.body;
        
        // Initialize repository and service
        const authService = new AuthService();

        // instance of UnitOfWork to manage transaction and repositories
        const uow = new DrizzleUnitOfWork(db);

        // Register tenant and generate token
        const { tenant, token } = await authService.registerTenant(uow, { name, email, password });

        return res.status(201).json({
            success: true,
            message: "Tenant registered successfully",
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
        console.error("Error in registerTenant controller:", error);
        
        // Handle specific error cases
        if (error instanceof Error) {
            if (error.message.includes("already exists")) {
                return res.status(409).json({
                    success: false,
                    message: error.message,
                });
            }
        }

        return res.status(500).json({
            success: false,
            message: "Error registering tenant",
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
