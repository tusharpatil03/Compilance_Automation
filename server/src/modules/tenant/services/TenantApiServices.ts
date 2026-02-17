import { db } from "../../../db/connection";
import { TenantAPIKeyRepository, TenantRepository, WebhookRepository } from "../respository";
import { NewTenantApiKey, NewWebhook, TenantApiKey, Webhook } from "../schema";
import { createHmac } from "crypto";

interface ITenantApiServices {
    createApiKey(payload: NewTenantApiKey): Promise<NewTenantApiKey>;
    deactivateApiKey(kid: string, tenantId?: number): Promise<void>;
    removeApiKey(kid: string, tenantId?: number): Promise<void>;
    listApiKeys(tenantId: number, options?: { limit?: number; offset?: number }): Promise<TenantApiKey[]>;
    createWebhook(payload: NewWebhook): Promise<Webhook>;
    getWebHooks(tenantId: number, options?: { limit?: number; offset?: number }): Promise<Webhook[]>;
}

export class TenantApiServices implements ITenantApiServices {
    private tenantApiKeyRepository: TenantAPIKeyRepository;
    private tenantRepository: TenantRepository;
    private webhookRepository: WebhookRepository;

    constructor() {
        this.tenantApiKeyRepository = new TenantAPIKeyRepository(db);
        this.tenantRepository = new TenantRepository(db);
        this.webhookRepository = new WebhookRepository(db);
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

    async listApiKeys(tenantId: number, options?: { limit?: number; offset?: number }): Promise<TenantApiKey[]> {
        return this.tenantApiKeyRepository.getApiKeysByTenantIdPaginated(tenantId, options);
    }

    //webhook services
    async createWebhook(payload: NewWebhook): Promise<Webhook> {
        // Validate tenant
        const tenant = await this.tenantRepository.getTenantById(payload.tenant_id);
        if (!tenant) {
            throw new Error(`Tenant with ID ${payload.tenant_id} does not exist.`);
        }

        const supportedEvents = ["api_key.created", "api_key.deactivated", "api_key.rotated", "tenant.updated"];


        const secret = createHmac("sha256", process.env.WEBHOOK_SECRET || "default_secret").update(`${payload.tenant_id}:${payload.url}:${Date.now()}`).digest("hex");

        // Normalize payload fields
        const toCreate: NewWebhook = {
            tenant_id: payload.tenant_id,
            url: payload.url,
            events: supportedEvents,
            secret,
        } as NewWebhook;

        const newWebhook = await this.webhookRepository.createWebhook(toCreate);
        return newWebhook;
    }

    getWebHooks(tenantId: number, options?: { limit?: number; offset?: number; }): Promise<Webhook[]> {
        return this.webhookRepository.getWebhooksByTenantId(tenantId);
    }
}