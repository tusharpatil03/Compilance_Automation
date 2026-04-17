import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth";
import { TenantApiServices } from "../services/TenantApiServices";
import { sendErrorResponse, sendSuccessResponse, Errors, ApiError } from "../../../utils/errorHandler";

export async function listWebhooks(req: Request, res: Response) {
    try {
        const authReq = req as AuthenticatedRequest;
        const tenantId = authReq.tenant?.id;

        if (!tenantId) {
            return sendErrorResponse(res, Errors.authRequired());
        }

        const limit = Number(req.query.limit ?? 50);
        const offset = Number(req.query.offset ?? 0);

        const service = new TenantApiServices();
        const webhooks = await service.getWebHooks(tenantId, { limit, offset });

        const sanitized = webhooks.map(({ secret, ...rest }) => rest);

        return sendSuccessResponse(
            res,
            200,
            "Webhooks retrieved successfully",
            sanitized,
            { limit, offset, total: sanitized.length }
        );
    } catch (error: any) {
        if (error instanceof ApiError) {
            return sendErrorResponse(res, error);
        }

        return sendErrorResponse(
            res,
            Errors.internalError(error?.message ?? "Failed to list webhooks"),
            500
        );
    }
}
