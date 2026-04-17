import { and, eq } from "drizzle-orm";
import { BaseRepository, type DrizzleClient } from "../../repositories/BaseRepository";
import { ApiKeyStatus, NewWebhook, TenantApiKey, tenants, tenants_api_key, Webhook, webhooks } from "./schema";
import { Tenant, NewTenant, NewTenantApiKey } from "./schema";

// Define the ITenantRepository interface
export interface ITenantRepository {
    createTenant(payload: Partial<NewTenant>): Promise<Tenant>;
    getTenantByEmail(email: string): Promise<Tenant | null>;
    getTenantById(id: number): Promise<Tenant | null>;
    updateTenant(id: number, payload: Partial<NewTenant>): Promise<Tenant>;
}

export type IUpdateTenantPayload = Omit<Partial<NewTenant>, "id" | "created_at" | "updated_at">;

// Create a base repository class for tenants
class TenantRepositoryBase extends BaseRepository<typeof tenants> { }

// Implement the TenantRepository class (fixed typo)
export class TenantRepository extends TenantRepositoryBase implements ITenantRepository {
    // Initialize the repository with the database connection and tenants table
    constructor(db: DrizzleClient) {
        super(db, tenants);
    }

    // Method to create a new tenant
    async createTenant(payload: NewTenant): Promise<Tenant> {
        const db = this.getDb();
        const [created] = await db.insert(this.table).values(payload as NewTenant).returning();
        return created as unknown as Tenant;
    }

    // Method to get a tenant by email (fixed: was querying name instead of email)
    async getTenantByEmail(email: string): Promise<Tenant | null> {
        const db = this.getDb();
        const tenant = await db
            .select()
            .from(this.table)
            .where(eq(this.table.email, email))
            .limit(1)
            .execute();
        return (tenant[0] ?? null) as unknown as Tenant | null;
    }

    // Method to get a tenant by ID
    async getTenantById(id: number): Promise<Tenant | null> {
        const db = this.getDb();
        const tenant = await db
            .select()
            .from(this.table)
            .where(eq(this.table.id, id))
            .limit(1)
            .execute();
        return (tenant[0] ?? null) as unknown as Tenant | null;
    }

    // Method to update a tenant
    async updateTenant(id: number, payload: IUpdateTenantPayload): Promise<Tenant> {
        const db = this.getDb();
        const [updated] = await db
            .update(this.table)
            .set({ ...payload, updated_at: new Date().toISOString() })
            .where(eq(this.table.id, id))
            .returning();
        return updated as unknown as Tenant;
    }
}

// API Key Repository interfaces and implementations will be added when implementing
// the API key generation feature in a future iteration
interface ITenantApiKeyRepository {
    createApiKey(payload: NewTenantApiKey): Promise<TenantApiKey>;
    changeStatus(id: number, status: ApiKeyStatus): Promise<TenantApiKey>;
    revokeApiKey(id: number): Promise<TenantApiKey>;
    removeApiKey(id: number): Promise<void>;
    getApiKeyByKey_prefix(key_prefix: string, tenantId: number): Promise<TenantApiKey | null>;
    getApiKeysByTenantId(tenantId: number): Promise<TenantApiKey[]>;
    getActiveApiKeyByKeyPrefix(key_prefix: string, tenantId: number): Promise<TenantApiKey | null>;
}

class TenantApiKeyRepositoryBase extends BaseRepository<typeof tenants_api_key> { };

export class TenantAPIKeyRepository extends TenantApiKeyRepositoryBase implements ITenantApiKeyRepository {
    constructor(db: DrizzleClient) {
        super(db, tenants_api_key);
    }

    async createApiKey(payload: NewTenantApiKey): Promise<TenantApiKey> {
        const db = this.getDb();
        const [created] = await db.insert(this.table).values(payload).returning();
        return created as unknown as TenantApiKey;
    }

    async changeStatus(id: number, status: ApiKeyStatus): Promise<TenantApiKey> {
        const db = this.getDb();
        const [updated] = await db
            .update(this.table)
            .set({ status, updated_at: new Date().toISOString() })
            .where(eq(this.table.id, id))
            .returning();
        return updated as unknown as TenantApiKey;
    }

    async revokeApiKey(id: number): Promise<TenantApiKey> {
        const db = this.getDb();
        const [revoked] = await db
            .update(this.table)
            .set({
                status: "revoked" as ApiKeyStatus,
                revoked_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .where(eq(this.table.id, id))
            .returning();
        return revoked as unknown as TenantApiKey;
    }

    async removeApiKey(id: number): Promise<void> {
        const db = this.getDb();
        await db
            .delete(this.table)
            .where(eq(this.table.id, id));
    }

    async getApiKeyByKey_prefix(key_prefix: string, tenant_id: number): Promise<TenantApiKey | null> {
        const db = this.getDb();
        const [apiKey] = await db
            .select()
            .from(this.table)
            .where(and(eq(this.table.key_prefix, key_prefix), eq(this.table.tenant_id, tenant_id)))
            .limit(1)
            .execute();
        return apiKey ?? null;
    }

    async getApiKeysByTenantId(tenantId: number): Promise<TenantApiKey[]> {
        const db = this.getDb();
        const apiKeys = await db
            .select()
            .from(this.table)
            .where(eq(this.table.tenant_id, tenantId))
            .execute();
        return apiKeys as unknown as TenantApiKey[];
    }

    async getActiveApiKeyByKeyPrefix(key_prefix: string, tenantId: number): Promise<TenantApiKey | null> {
        const db = this.getDb();
        const [apiKey] = await db
            .select()
            .from(this.table)
            .where(and(
                eq(this.table.key_prefix, key_prefix),
                eq(this.table.tenant_id, tenantId),
                eq(this.table.status, "active" as ApiKeyStatus)
            ))
            .limit(1)
            .execute();
        return apiKey ?? null;
    }
}


// Webhooks repository
class WebhookRepositoryBase extends BaseRepository<typeof webhooks> { }

interface IWebhookRepository {
    createWebhook(payload: Partial<NewWebhook>): Promise<Webhook>;
    getWebhooksByTenantId(tenantId: number): Promise<Webhook[]>;
    deleteWebhook(id: number): Promise<void>;
    deleteWebhooksByTenantId(tenantId: number): Promise<void>;
}

export class WebhookRepository extends WebhookRepositoryBase implements IWebhookRepository {
    constructor(db: DrizzleClient) {
        super(db, webhooks);
    }

    async createWebhook(payload: Partial<NewWebhook>): Promise<Webhook> {
        const db = this.getDb();
        const [created] = await db.insert(this.table).values(payload as NewWebhook).returning();
        return created as unknown as Webhook;
    }

    async getWebhooksByTenantId(tenantId: number): Promise<Webhook[]> {
        const db = this.getDb();
        const hooks = await db
            .select()
            .from(this.table)
            .where(eq(this.table.tenant_id, tenantId))
            .execute();
        return hooks as unknown as Webhook[];
    }

    async deleteWebhook(id: number): Promise<void> {
        const db = this.getDb();
        await db
            .delete(this.table)
            .where(eq(this.table.id, id));
    }

    async deleteWebhooksByTenantId(tenantId: number): Promise<void> {
        const db = this.getDb();
        await db
            .delete(this.table)
            .where(eq(this.table.tenant_id, tenantId));
    }
}