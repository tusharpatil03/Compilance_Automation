import { Request, Response } from "express";
import { TenantApiServices } from "../services/TenantApiServices";
import { sendErrorResponse, sendSuccessResponse, Errors, ApiError } from "../../../utils/errorHandler";
import type { AuthenticatedRequest } from "../middlewares/auth";

export async function removeApiKey(req: Request, res: Response) {
    try {
        const { kid } = req.body as { kid?: string };

        if (!kid) {
            return sendErrorResponse(res, Errors.missingRequired("kid"));
        }

        const authReq = req as AuthenticatedRequest;
        const tenantId = authReq.tenant?.id;

        if (!tenantId) {
            return sendErrorResponse(res, Errors.authRequired());
        }

        const service = new TenantApiServices();
        await service.removeApiKey(kid, tenantId);

        return sendSuccessResponse(res, 200, "API key has been removed");
    } catch (error: any) {
        if (error instanceof ApiError) {
            return sendErrorResponse(res, error);
        }

        if (error?.message?.includes("Forbidden")) {
            return sendErrorResponse(res, Errors.keyDoesNotBelong());
        }

        if (error?.message?.includes("not exist")) {
            return sendErrorResponse(res, Errors.apiKeyNotFound(req.body?.kid), 404);
        }

        return sendErrorResponse(
            res,
            Errors.internalError(error?.message ?? "Failed to remove API key"),
            500
        );
    }
}