import { Request, Response } from "express";
import { TenantApiServices } from "../services/TenantApiServices";
import type { AuthenticatedRequest } from "../middlewares/auth";

export async function changeApiKeyStatus(req: Request, res: Response) {
    try {
        const keyId = req.params.id || req.body.kid;
        const newStatus = req.body.status; // expected to be 'active' or 'inactive'

        if (!keyId || !newStatus) {
            return res.status(400).json({ error: "Key ID and new status are required." });
        }

        const authReq = req as AuthenticatedRequest;
        const tenantId = authReq.tenant?.id ?? req.body.tenant_id;

        const tenantApiServices = new TenantApiServices();
        
        if (newStatus === "inactive") {
            await tenantApiServices.deactivateApiKey(keyId, tenantId);
            return res.status(200).json({ message: `API key with ID ${keyId} has been deactivated.` });
        } else {
            return res.status(400).json({ error: "Unsupported status change requested." });
        }
    } catch (error: any) {
        const status = error?.message?.includes("Forbidden") ? 403 : 400;
        return res.status(status).json({ error: error.message ?? "Failed to change API key status" });
    }
}