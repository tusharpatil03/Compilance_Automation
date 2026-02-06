import { Request, Response, NextFunction } from "express"
import { TenantAPIKeyRepository } from "../../tenant/respository";
import { db } from "../../../db/connection";
import { compareApiKeyHash } from "../../../utils/security";

export async function apiAuth(req:Request, res:Response, next:NextFunction){
    const key_id = req.body.api_key_id;
    const api_key = req.body.api_key;

    const tenantApiKeyRepo = new TenantAPIKeyRepository(db);
    //fetch instance from database
    const tenant_api_key = await tenantApiKeyRepo.getApiKeyByKid(key_id);

    if(!tenant_api_key){
        res.status(400).json({ message: "Please provide valid API Key_id" });
        return;
    }

    //check key is active or not
    if (tenant_api_key.status === "inactive" || tenant_api_key.status === "suspended"){
        res.status(400).json({ message: "Key is inavtive or suspended! use different key" });
        return;
    }

    const isValidKey = await compareApiKeyHash(api_key, tenant_api_key.api_key_hash);
    if(!isValidKey){
        res.status(200).json({message: "Invalid Key"})
    }

    //inject tenant info into request for downstream handlers
    (req as any).tenant = { id: tenant_api_key.tenant_id };

    return next();
}