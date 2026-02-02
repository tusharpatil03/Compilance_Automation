import { Request, Response } from "express";
import { TenantApiServices } from "../services/TenantApiServices";
import { NewTenantApiKey } from "../schema";
import { generateApiKey, hashApiKey } from "../../../utils/security";
import crypto from "crypto";
import type { AuthenticatedRequest } from "../middlewares/auth";

export async function createApiKey(req: Request, res: Response) {
    try {
        const { tenant_id, label, expires_at } = req.body as {
            tenant_id?: number;
            label?: string;
            expires_at?: string;
        };

        // Prefer authenticated tenant id if middleware is used; fallback to body for now
        const authReq = req as AuthenticatedRequest;
        const effectiveTenantId = authReq.tenant?.id ?? tenant_id;

        if (!effectiveTenantId) {
            return res.status(400).json({ error: "tenant_id is required" });
        }

        // Generate secret and hash
        const api_key = generateApiKey();
        const api_key_hash = hashApiKey(api_key);

        // Create random, collision-resistant kid (prefix for readability)
        const kid = `kid_${crypto.randomBytes(8).toString("hex")}`;

        const payload: NewTenantApiKey = {
            tenant_id: effectiveTenantId,
            api_key_hash,
            label,
            kid,
            expires_at,
        } as NewTenantApiKey;

        const tenantApiServices = new TenantApiServices();
        const created = await tenantApiServices.createApiKey(payload);

        // Do not leak api_key_hash back to client
        const { api_key_hash: _omitted, ...sanitized } = created as any;

        return res.status(201).json({
            message: "API key created successfully",
            api_key, // one-time reveal
            key: sanitized,
        });
    } catch (error: any) {
        const status = error?.message?.includes("active API key") ? 409 : 400;
        return res.status(status).json({ error: error.message ?? "Failed to create API key" });
    }
}