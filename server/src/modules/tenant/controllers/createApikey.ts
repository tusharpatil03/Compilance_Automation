import { Request, Response } from "express";
import { TenantApiServices } from "../services/TenantApiServices";
import { NewTenantApiKey } from "../schema";
import { encryptData, generateApiKey, hashApiKey } from "../../../utils/security";
import { sendErrorResponse, sendSuccessResponse, Errors, ApiError } from "../../../utils/errorHandler";
import type { AuthenticatedRequest } from "../middlewares/auth";

export async function createApiKey(req: Request, res: Response) {
    try {
        const { kid, expires_at } = req.body as {
            kid: string;
            expires_at?: string;
        };

        const authReq = req as AuthenticatedRequest;
        const tenantId = authReq.tenant?.id;

        if (!tenantId) {
            return sendErrorResponse(res, Errors.authRequired());
        }

        // Generate secret and hash
        const api_key = generateApiKey();
        const api_key_hash = hashApiKey(api_key);

        // Encrypt api key before storing
        const encryptedApiKey = encryptData(
            api_key,
            process.env.API_KEY_ENCRYPTION_SECRET || "default_encryption_secret"
        );

        const payload: NewTenantApiKey = {
            tenant_id: tenantId,
            api_key_hash,
            api_key: encryptedApiKey, // store encrypted version
            key_prefix: kid,
            expires_at,
        } as NewTenantApiKey;

        const tenantApiServices = new TenantApiServices();
        const created = await tenantApiServices.createApiKey(payload);

        // Do not leak api_key_hash back to client
        const { api_key_hash: _omitted, ...sanitized } = created as any;

        return sendSuccessResponse(res, 201, "API key created successfully", {
            api_key, // one-time reveal
            key: sanitized,
        });
    } catch (error: any) {
        if (error instanceof ApiError) {
            return sendErrorResponse(res, error);
        }

        if (error?.message?.includes("already exists")) {
            return sendErrorResponse(res, Errors.keyAlreadyExists(req.body?.kid));
        }

        if (error?.message?.includes("Tenant")) {
            return sendErrorResponse(res, Errors.tenantNotFound(req.body?.tenant_id));
        }

        return sendErrorResponse(
            res,
            Errors.internalError(error?.message ?? "Failed to create API key"),
            500
        );
    }
}