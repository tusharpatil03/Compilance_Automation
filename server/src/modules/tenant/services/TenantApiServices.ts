import { db } from "../../../db/connection";
import { TenantAPIKeyRepository, TenantRepository } from "../respository";
import { NewTenantApiKey } from "../schema";

interface ITenantApiServices {
    createApiKey(payload: NewTenantApiKey): Promise<NewTenantApiKey>;
    deactivateApiKey(kid: string, tenantId?: number): Promise<void>;
    removeApiKey(kid: string, tenantId?: number): Promise<void>;
    listApiKeys(tenantId: number, options?: { limit?: number; offset?: number }): Promise<NewTenantApiKey[]>;
}

export class TenantApiServices implements ITenantApiServices {
    private tenantApiKeyRepository: TenantAPIKeyRepository;
    private tenantRepository: TenantRepository;

    constructor() {
        this.tenantApiKeyRepository = new TenantAPIKeyRepository(db);
        this.tenantRepository = new TenantRepository(db);
    }

    async createApiKey(payload: NewTenantApiKey): Promise<NewTenantApiKey> {
        // Validate tenant
        if (!payload.tenant_id) {
            throw new Error("Tenant ID is required to create an API key.");
        }
        const tenant = await this.tenantRepository.getTenantById(payload.tenant_id);
        if (!tenant) {
            throw new Error(`Tenant with ID ${payload.tenant_id} does not exist.`);
        }

        // Enforce single active key per tenant (business rule)
        const existingKeys = await this.tenantApiKeyRepository.getApiKeysByTenantId(payload.tenant_id);
        const hasActive = existingKeys.some((key) => key.status === "active");
        if (hasActive) {
            throw new Error(
                `An active API key already exists for tenant ID ${payload.tenant_id}. Please deactivate it before creating a new one.`
            );
        }

        // Normalize payload fields
        const toCreate: NewTenantApiKey = {
            tenant_id: payload.tenant_id,
            api_key_hash: payload.api_key_hash,
            label: payload.label ?? "",
            kid: payload.kid,
            expires_at: payload.expires_at,
            status: "active",
        } as NewTenantApiKey;

        const newApiKey = await this.tenantApiKeyRepository.createApiKey(toCreate);
        return newApiKey;
    }

    async deactivateApiKey(kid: string, tenantId?: number): Promise<void> {
        const existingKey = await this.tenantApiKeyRepository.getApiKeyByKid(kid);
        if (!existingKey) {
            throw new Error(`API key with ID ${kid} does not exist.`);
        }
        if (tenantId && existingKey.tenant_id !== tenantId) {
            throw new Error("Forbidden: key does not belong to tenant");
        }
        if (existingKey.status === "inactive") {
            // idempotent
            return;
        }
        await this.tenantApiKeyRepository.deactivateApiKey(kid);
    }

    async removeApiKey(kid: string, tenantId?: number): Promise<void> {
        const existingKey = await this.tenantApiKeyRepository.getApiKeyByKid(kid);
        if (!existingKey) {
            throw new Error(`API key with ID ${kid} does not exist.`);
        }
        if (tenantId && existingKey.tenant_id !== tenantId) {
            throw new Error("Forbidden: key does not belong to tenant");
        }
        await this.tenantApiKeyRepository.removeApiKey(kid);
    }

    async listApiKeys(tenantId: number, options?: { limit?: number; offset?: number }): Promise<NewTenantApiKey[]> {
        const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
        const offset = Math.max(options?.offset ?? 0, 0);
        // Currently repository does not support pagination; fetch all then slice to avoid scope creep
        const apiKeys = await this.tenantApiKeyRepository.getApiKeysByTenantId(tenantId);
        return apiKeys.slice(offset, offset + limit);
    }
}