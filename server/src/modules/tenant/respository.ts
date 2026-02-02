import { eq } from "drizzle-orm";
import { BaseRepository } from "../../repositories/BaseRepository";
import { tenants, tenants_api_key } from "./schema";
import { Tenant, NewTenant, NewTenantApiKey } from "./schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// Define the ITenantRepository interface
export interface ITenantRepository {
    createTenant(payload: Partial<NewTenant>): Promise<Tenant>;
    getTenantByEmail(email: string): Promise<Tenant | null>;
    getTenantById(id: number): Promise<Tenant | null>;
    updateTenant(id: number, payload: Partial<NewTenant>): Promise<Tenant>;
}

// Create a base repository class for tenants
class TenantRepositoryBase extends BaseRepository<typeof tenants, any> { }

// Implement the TenantRepository class (fixed typo)
export class TenantRepository extends TenantRepositoryBase implements ITenantRepository {
    // Initialize the repository with the database connection and tenants table
    constructor(db: NodePgDatabase<any>) {
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
    async updateTenant(id: number, payload: Partial<NewTenant>): Promise<Tenant> {
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
    createApiKey(payload: NewTenantApiKey): Promise<NewTenantApiKey>;
    updateApiKey(kid: string, payload: Partial<NewTenantApiKey>): Promise<NewTenantApiKey>;
    deactivateApiKey(kid: string): Promise<void>;
    removeApiKey(kid: string): Promise<void>;
}

class TenantApiKeyRepositoryBase extends BaseRepository<typeof tenants_api_key, any> { };
export class TenantAPIKeyRepository extends TenantApiKeyRepositoryBase implements ITenantApiKeyRepository {
    constructor(db: NodePgDatabase<any>) {
        super(db, tenants_api_key);
    }
    async createApiKey(payload: NewTenantApiKey): Promise<NewTenantApiKey> {
        const db = this.getDb();
        return db.insert(this.table).values(payload).returning().then(([created]) => created as unknown as NewTenantApiKey);
    };
    async updateApiKey(kid: string, payload: Partial<NewTenantApiKey>): Promise<NewTenantApiKey> {
        const db = this.getDb();
        const [updated] = await db
            .update(this.table)
            .set({ ...payload, updated_at: new Date().toISOString() })
            .where(eq(this.table.kid, kid))
            .returning();
        return updated as unknown as NewTenantApiKey;
    };
    async deactivateApiKey(kid: string): Promise<void> {
        const db = this.getDb();
        await db
            .update(this.table)
            .set({ status: "inactive", updated_at: new Date().toISOString() })
            .where(eq(this.table.kid, kid));
    };
    async removeApiKey(kid: string): Promise<void> {
        const db = this.getDb();
        await db
            .delete(this.table)
            .where(eq(this.table.kid, kid));
    }

    async getApiKeyByKid(kid: string): Promise<NewTenantApiKey | null> {
        const db = this.getDb();
        const apiKey = await db
            .select()
            .from(this.table)
            .where(eq(this.table.kid, kid))
            .limit(1)
            .execute();
        return (apiKey[0] ?? null) as unknown as NewTenantApiKey | null;
    }

    async getApiKeysByTenantId(tenantId: number): Promise<NewTenantApiKey[]> {
        const db = this.getDb();
        const apiKeys = await db
            .select()
            .from(this.table)
            .where(eq(this.table.tenant_id, tenantId))
            .execute();
        return apiKeys;
    }

    async getApiKeysByTenantIdPaginated(
        tenantId: number,
        options?: { limit?: number; offset?: number }
    ): Promise<NewTenantApiKey[]> {
        const db = this.getDb();
        const { limit, offset } = this.normalizePagination(options);
        const apiKeys = await db
            .select()
            .from(this.table)
            .where(eq(this.table.tenant_id, tenantId))
            .limit(limit)
            .offset(offset)
            .execute();
        return apiKeys as unknown as NewTenantApiKey[];
    }
}