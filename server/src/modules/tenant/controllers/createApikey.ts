import { Request, Response } from "express";
import { TenantApiServices } from "../services/TenantApiServices";
import { NewTenantApiKey } from "../schema";
import { encryptData, generateApiKey, hashApiKey } from "../../../utils/security";
import { sendErrorResponse, sendSuccessResponse, ApiError } from "../../../utils/errorHandler";
import type { AuthenticatedRequest } from "../middlewares/auth";
import { ErrorCode } from "../../../utils/APIContract";

export async function createApiKey(req: Request, res: Response) {
    try {
        const { lable = "my key", expires_at } = req.body as {
            lable: string;
            expires_at?: string;
        };

        // Generate a unique key identifier (kid) for tenant
        // kid = lable + random suffix to ensure uniqueness
        const randomSuffix = Math.random().toString(36).substring(2, 8); // 6 char random string
        const kid = `${lable.trim()}-${randomSuffix}`;

        const authReq = req as AuthenticatedRequest;
        const tenantId = authReq.tenant?.id;

        if (!tenantId) {
            return sendErrorResponse(res, new ApiError(ErrorCode.AUTH_REQUIRED, "Authentication required", 401));
        }

        // Generate secret and hash
        const api_key = generateApiKey();
        const api_key_hash = hashApiKey(api_key);

        // Encrypt api key before storing
        let encryptedApiKey;
        try{
            encryptedApiKey = encryptData(
                api_key,
            );
        }catch(error){
            console.error("Encryption error details:", error);
            console.error("Error encrypting API key:", api_key.length);
            return sendErrorResponse(res, new ApiError(ErrorCode.INTERNAL_ERROR, "Failed to encrypt API key", 500));
        }

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
        console.error("Error creating API key:", error);
        if (error instanceof ApiError) {
            return sendErrorResponse(res, error);
        }

        if (error?.message?.includes("already exists")) {
            return sendErrorResponse(res, new ApiError(ErrorCode.KEY_ALREADY_EXISTS, `API key with ID '${req.body?.kid}' already exists for this tenant`, 409, "kid"));
        }

        if (error?.message?.includes("Tenant")) {
            return sendErrorResponse(res, new ApiError(ErrorCode.TENANT_NOT_FOUND, `Tenant with ID ${req.body?.tenant?.id} not found`, 404));
        }

        return sendErrorResponse(res, new ApiError(ErrorCode.INTERNAL_ERROR, error?.message ?? "Failed to create API key", 500));
    }
}