//list api keys controller

import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth";
import { TenantApiServices } from "../services/TenantApiServices";
import { sendErrorResponse, sendSuccessResponse, ApiError } from "../../../utils/errorHandler";
import { ErrorCode } from "../../../utils/APIContract";

export async function listApiKeys(req: Request, res: Response) {
    try {
        const authReq = req as AuthenticatedRequest;
        const tenantId = authReq.tenant?.id;

        if (!tenantId) {
            return sendErrorResponse(res, new ApiError(ErrorCode.AUTH_REQUIRED, "Authentication required", 401));
        }

        const rawLimit = req.query.limit ?? 50;
        const rawOffset = req.query.offset ?? 0;
        const limit = Number(rawLimit);
        const offset = Number(rawOffset);

        if (Number.isNaN(limit) || limit <= 0) {
            return sendErrorResponse(res, new ApiError(ErrorCode.VALIDATION_ERROR, "Invalid limit", 400, "limit"));
        }

        if (Number.isNaN(offset) || offset < 0) {
            return sendErrorResponse(res, new ApiError(ErrorCode.VALIDATION_ERROR, "Invalid offset", 400, "offset"));
        }

        const cappedLimit = Math.min(limit, 50);

        const service = new TenantApiServices();
        const keys = await service.listApiKeys(tenantId, { limit: cappedLimit, offset });

        // Never send api_key_hash
        const sanitized = keys.map(({ api_key_hash, ...rest }) => rest);

        return sendSuccessResponse(
            res,
            200,
            "API keys retrieved successfully",
            sanitized,
            { limit: cappedLimit, offset, count: sanitized.length }
        );
    } catch (error: any) {
        if (error instanceof ApiError) {
            return sendErrorResponse(res, error);
        }

        return sendErrorResponse(res, new ApiError(ErrorCode.INTERNAL_ERROR, error?.message ?? "Failed to list API keys", 500));
    }
}