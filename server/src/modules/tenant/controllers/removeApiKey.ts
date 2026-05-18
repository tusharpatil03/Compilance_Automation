import { Request, Response } from "express";
import { TenantApiServices } from "../services/TenantApiServices";
import { sendErrorResponse, sendSuccessResponse, ApiError } from "../../../utils/errorHandler";
import { ErrorCode } from "../../../utils/APIContract";
import type { AuthenticatedRequest } from "../middlewares/auth";

export async function removeApiKey(req: Request, res: Response) {
    try {
        const { kid } = req.body as { kid?: string };

        if (!kid) {
            return sendErrorResponse(res, new ApiError(ErrorCode.MISSING_REQUIRED_FIELD, "Missing required field: kid", 400, "kid"));
        }

        const authReq = req as AuthenticatedRequest;
        const tenantId = authReq.tenant?.id;

        if (!tenantId) {
            return sendErrorResponse(res, new ApiError(ErrorCode.AUTH_REQUIRED, "Authentication required", 401));
        }

        const service = new TenantApiServices();
        await service.removeApiKey(kid, tenantId);

        return sendSuccessResponse(res, 200, "API key has been removed");
    } catch (error: any) {
        if (error instanceof ApiError) {
            return sendErrorResponse(res, error);
        }

        if (error?.message?.includes("Forbidden")) {
            return sendErrorResponse(res, new ApiError(ErrorCode.KEY_DOES_NOT_BELONG, "This key does not belong to your tenant", 403));
        }

        if (error?.message?.includes("not exist")) {
            return sendErrorResponse(res, new ApiError(ErrorCode.API_KEY_NOT_FOUND, `API key '${req.body?.kid}' not found`, 404));
        }

        return sendErrorResponse(res, new ApiError(ErrorCode.INTERNAL_ERROR, error?.message ?? "Failed to remove API key", 500));
    }
}