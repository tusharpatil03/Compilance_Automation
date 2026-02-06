import { risk_profile, RiskProfile, users } from "./schema";
import { BaseRepository } from "../../repositories/BaseRepository";
import { eq } from "drizzle-orm";
import { User, NewUser } from "./schema"
import type { DrizzleClient } from "../../repositories/BaseRepository";

interface IQueryParameters {
    limit?: number;
    offset?: number;
}

type QueryTenantUsers = IQueryParameters & {
    tenant_id: number;
}

export interface IUserRepository {
    getUserById(external_id: string): Promise<User | null>;
    getUserByExternalIdAndTenant(external_id: string, tenant_id: number): Promise<User | null>;
    getUsers(params: QueryTenantUsers): Promise<User[]>;
    createUser(payload: NewUser): Promise<User>;
    updateUser(external_id: string, payload: Partial<NewUser>): Promise<User>;
    updateUserForTenant(external_id: string, tenant_id: number, payload: Partial<NewUser>): Promise<User>;
    deleteUserById(id: number): Promise<void>;
}


export class UserRepository extends BaseRepository<typeof users> implements IUserRepository {
    constructor(db: DrizzleClient) {
        super(db, users);
    }

    async createUser(payload: NewUser): Promise<User> {
        console.log("Inserting user with payload", payload);
        try{
            const db = this.getDb();
            const [created] = await db.insert(users).values(payload as NewUser).returning();
            return created as unknown as User;
        }catch (err: any) {
            console.error("Error inserting user", { payload, error: err });
            return null as unknown as User; // or throw an error depending on your error handling strategy
        }
    }

    async getUserById(external_id: string): Promise<User | null> {
        const db = this.getDb();
        if (!external_id) {
            return null;
        }
        try {
            // Ensure limit is numeric to avoid driver/prepare mismatch
            const user = await db.select().from(users).where(eq(users.external_customer_id, external_id)).limit(1).execute();
            return (user[0] ?? null) as unknown as User | null;
        } catch (err: any) {
            // Re-throw with extra context to make runtime debugging easier
            const message = `UserRepository.getUserById failed for external_id=${external_id} - ${err?.message ?? err}`;
            const e = new Error(message);
            // attach original error for upstream logging
            (e as any).cause = err;
            throw e;
        }
    }

    async getUserByExternalIdAndTenant(external_id: string, tenant_id: number): Promise<User | null> {
        const db = this.getDb();
        if (!external_id || !tenant_id) {
            return null;
        }
        const result = await db
            .select()
            .from(users)
            .where(eq(users.external_customer_id, external_id))
            .limit(1)
            .execute();

        const user = (result[0] ?? null) as unknown as User | null;
        if (!user) return null;
        // additional guard: ensure tenant match
        return user.tenant_id === tenant_id ? user : null;
    }


    async getUsers(params: QueryTenantUsers): Promise<User[]> {
        const db = this.getDb();
        const { limit, offset } = this.normalizePagination(params);
        const tenant_id = params.tenant_id;
        const list = await db.select().from(users).where(eq(users.tenant_id, tenant_id)).limit(limit).offset(offset).execute();
        return list as unknown as User[];
    }

    async updateUser(external_id: string, payload: Partial<NewUser>): Promise<User> {
        const db = this.getDb();
        const [updated] = await db.update(users).set(payload as Partial<NewUser>).where(eq(users.external_customer_id, external_id)).returning();
        return updated as unknown as User;
    }

    async updateUserForTenant(external_id: string, tenant_id: number, payload: Partial<NewUser>): Promise<User> {
        const db = this.getDb();
        const [updated] = await db
            .update(users)
            .set(payload as Partial<NewUser>)
            .where(eq(users.external_customer_id, external_id))
            .returning();

        const user = updated as unknown as User;
        if (!user || user.tenant_id !== tenant_id) {
            throw new Error("User not found for tenant");
        }
        return user;
    }

    async deleteUserById(id: number): Promise<void> {
        const db = this.getDb();
        await db.delete(users).where(eq(users.id, id)).execute();
        return;
    }
}

//Risk Profile
interface IRiskProfileRepository {
    createRiskProfile(payload: { user_id: number; risk_score: number }): Promise<void>;
    getRiskProfileByUserId(user_id: number): Promise<{ risk_score: number } | null>;
}

class RiskProfileBaseRepository extends BaseRepository<typeof risk_profile> { };

export class RiskProfileRepository extends RiskProfileBaseRepository implements IRiskProfileRepository {
    constructor(db: DrizzleClient) {
        super(db, risk_profile);
    }

    async createRiskProfile(payload: { user_id: number; risk_score: number }): Promise<void> {
        const db = this.getDb();
        await db.insert(risk_profile).values({
            user_id: payload.user_id,
            risk_score: payload.risk_score,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }).execute();
    }

    async getRiskProfileByUserId(user_id: number): Promise<{ risk_score: number } | null> {
        const db = this.getDb();
        const result = await db.select().from(risk_profile).where(eq(risk_profile.user_id, user_id)).limit(1).execute();
        if (result.length === 0) {
            return null;
        }
        return { risk_score: (result[0] as any).risk_score };
    }
}