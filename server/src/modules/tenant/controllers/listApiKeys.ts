//list api keys controller

import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth";
import { TenantApiServices } from "../services/TenantApiServices";

export async function listApiKeys(req: Request, res: Response) {
    try {
        const authReq = req as AuthenticatedRequest;
        const tenantId = authReq.tenant?.id ?? req.body.tenant_id;
        if (!tenantId) {
            return res.status(400).json({ error: "tenant_id is required" });
        }

        const limit = Number(req.query.limit ?? 50);
        const offset = Number(req.query.offset ?? 0);
        const service = new TenantApiServices();
        const keys = await service.listApiKeys(tenantId, { limit, offset });

        // Never send api_key_hash
        const sanitized = keys.map(({ api_key_hash, ...rest }) => rest);
        return res.status(200).json({ data: sanitized, pagination: { limit, offset, count: sanitized.length } });
    } catch (error: any) {
        return res.status(400).json({ error: error.message ?? "Failed to list API keys" });
    }
}