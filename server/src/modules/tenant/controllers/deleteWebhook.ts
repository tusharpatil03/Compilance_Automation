import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth";
import { TenantApiServices } from "../services/TenantApiServices";
import { sendErrorResponse, sendSuccessResponse, ApiError } from "../../../utils/errorHandler";
import { ErrorCode } from "../../../utils/APIContract";


export async function deleteWebhook(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        if (!id || isNaN(Number(id))) {
            return sendErrorResponse(res, new ApiError(ErrorCode.INVALID_ID, `Invalid webhook ID: ${id || "undefined"}. Must be a valid number`, 400, "webhook ID"));
        }

        const authReq = req as AuthenticatedRequest;
        const tenantId = authReq.tenant?.id;

        if (!tenantId) {
            return sendErrorResponse(res, new ApiError(ErrorCode.AUTH_REQUIRED, "Authentication required", 401));
        }

        const service = new TenantApiServices();
        await service.deleteWebhook(Number(id), tenantId);

        return sendSuccessResponse(res, 200, "Webhook deleted successfully");
    } catch (error: any) {
        if (error instanceof ApiError) {
            return sendErrorResponse(res, error);
        }

        if (error?.message?.includes("not found") || error?.message?.includes("does not belong")) {
            return sendErrorResponse(res, new ApiError(ErrorCode.WEBHOOK_NOT_FOUND, "Webhook not found", 404));
        }

        return sendErrorResponse(res, new ApiError(ErrorCode.INTERNAL_ERROR, error?.message ?? "Failed to delete webhook", 500));
    }
}
