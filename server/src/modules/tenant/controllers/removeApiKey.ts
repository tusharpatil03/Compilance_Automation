import { Request, Response } from "express";
import { TenantApiServices } from "../services/TenantApiServices";
import type { AuthenticatedRequest } from "../middlewares/auth";

export async function removeApiKey(req: Request, res: Response) {
  try {
    const keyId = req.params.id || req.body.kid;
    if (!keyId) {
      return res.status(400).json({ error: "Key ID is required." });
    }

    const authReq = req as AuthenticatedRequest;
    const tenantId = authReq.tenant?.id ?? req.body.tenant_id;
    const service = new TenantApiServices();
    await service.removeApiKey(keyId, tenantId);
    return res.status(200).json({ message: `API key with ID ${keyId} has been removed.` });
  } catch (error: any) {
    const status = error?.message?.includes("Forbidden") ? 403 : 400;
    return res.status(status).json({ error: error.message ?? "Failed to remove API key" });
  }
}