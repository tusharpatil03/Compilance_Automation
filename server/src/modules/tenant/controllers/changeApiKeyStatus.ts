import { Request, Response } from "express";
import { TenantApiServices } from "../services/TenantApiServices";
import { sendErrorResponse, sendSuccessResponse, Errors, ApiError } from "../../../utils/errorHandler";
import type { AuthenticatedRequest } from "../middlewares/auth";

export async function changeApiKeyStatus(req: Request, res: Response) {
    try {
        const { kid, status } = req.body as {
            kid?: string;
            status?: string;
        };

        if (!kid) {
            return sendErrorResponse(res, Errors.missingRequired("kid"));
        }

        if (!status) {
            return sendErrorResponse(res, Errors.missingRequired("status"));
        }

        const authReq = req as AuthenticatedRequest;
        const tenantId = authReq.tenant?.id;

        if (!tenantId) {
            return sendErrorResponse(res, Errors.authRequired());
        }

        const tenantApiServices = new TenantApiServices();

        if (status === "inactive") {
            await tenantApiServices.deactivateApiKey(kid, tenantId);
            return sendSuccessResponse(res, 200, "API key has been deactivated");
        } else if (status === "revoked") {
            await tenantApiServices.revokeApiKey(kid, tenantId);
            return sendSuccessResponse(res, 200, "API key has been revoked");
        } else {
            return sendErrorResponse(
                res,
                Errors.validationError("Invalid status. Valid statuses: 'inactive', 'revoked'")
            );
        }
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
            Errors.internalError(error?.message ?? "Failed to change API key status"),
            500
        );
    }
}