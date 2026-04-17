import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth";
import { TenantApiServices } from "../services/TenantApiServices";
import { WebhookRepository } from "../respository";
import { db } from "../../../db/connection";
import { sendErrorResponse, sendSuccessResponse, Errors, ApiError } from "../../../utils/errorHandler";

export async function deleteWebhook(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return sendErrorResponse(res, Errors.invalidId(id || "undefined", "webhook ID"));
        }

        const authReq = req as AuthenticatedRequest;
        const tenantId = authReq.tenant?.id;

        if (!tenantId) {
            return sendErrorResponse(res, Errors.authRequired());
        }

        // Verify webhook belongs to tenant
        const webhookRepository = new WebhookRepository(db);
        const webhooks = await webhookRepository.getWebhooksByTenantId(tenantId);
        const webhook = webhooks.find((w) => w.id === Number(id));

        if (!webhook) {
            return sendErrorResponse(res, Errors.webhookNotFound(), 404);
        }

        // Delete webhook
        await webhookRepository.deleteWebhook(Number(id));

        return sendSuccessResponse(res, 200, "Webhook deleted successfully");
    } catch (error: any) {
        if (error instanceof ApiError) {
            return sendErrorResponse(res, error);
        }

        if (error?.message?.includes("not found")) {
            return sendErrorResponse(res, Errors.webhookNotFound(), 404);
        }

        return sendErrorResponse(
            res,
            Errors.internalError(error?.message ?? "Failed to delete webhook"),
            500
        );
    }
}
