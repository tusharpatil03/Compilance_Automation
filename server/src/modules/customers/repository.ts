import { users } from "./schema";
import { BaseRepository } from "../../repositories/BaseRepository";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { WithPagination } from "../../repositories/Pagination";

// This replaces your manual 'interface IUser'
export type User = typeof users.$inferSelect;

// This is used for creating new users (automatically handles optional/default fields)
export type NewUser = typeof users.$inferInsert;

interface IQueryParameters {
    limit?: number;
    offset?: number;
}


export interface IUserRepository {
    listUsers(): Promise<User[]>;
    getUserById(param: { id: string }): Promise<User | null>;
    getUsers(params: IQueryParameters): Promise<User[]>;
    createUser(payload: Partial<NewUser>): Promise<User>;
    updateUser(id: number, payload: Partial<NewUser>): Promise<User>;
    deleteUserById(id: number): Promise<void>;
}


class UserRepositoryBase extends BaseRepository<typeof users, any> { };

const UserRepositoryWithPagination = WithPagination(UserRepositoryBase);

export class UserRepository extends UserRepositoryWithPagination implements IUserRepository {
    constructor(db: NodePgDatabase<any>) {
        super(db, users);
    }

    async createUser(payload: NewUser): Promise<User> {
        const db = this.getDb();
        const [created] = await db.insert(users).values(payload as NewUser).returning();
        return created as unknown as User;
    }

    async getUserById(param: { id: string }): Promise<User | null> {
        const db = this.getDb();
        if (!param.id) {
            return null;
        }
        try {
            // Ensure limit is numeric to avoid driver/prepare mismatch
            const user = await db.select().from(users).where(eq(users.external_customer_id, param.id)).limit(1).execute();
            return (user[0] ?? null) as unknown as User | null;
        } catch (err: any) {
            // Re-throw with extra context to make runtime debugging easier
            const message = `UserRepository.getUserByEmail failed for email=${param.id} - ${err?.message ?? err}`;
            const e = new Error(message);
            // attach original error for upstream logging
            (e as any).cause = err;
            throw e;
        }
    }

    async getUsers(params: IQueryParameters): Promise<User[]> {
        const db = this.getDb();
        const limit = params.limit ?? this.defaultLimit;
        const offset = params.offset ?? this.defaultOffset;
        const list = await db.select().from(users).limit(limit).offset(offset).execute();
        return list as unknown as User[];
    }

    async listUsers(): Promise<User[]> {
        const db = this.getDb();
        const list = await db.select().from(users).execute();
        return list as unknown as User[];
    }

    async updateUser(id: number, payload: Partial<NewUser>): Promise<User> {
        const db = this.getDb();
        const [updated] = await db.update(users).set(payload as Partial<NewUser>).where(eq(users.id, id)).returning();
        return updated as unknown as User;
    }

    async deleteUserById(id:number): Promise<void> {
        const db = this.getDb();
        await db.delete(users).where(eq(users.id, id)).execute();
        return;
    }
}
