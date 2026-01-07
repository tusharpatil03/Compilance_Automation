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

// Make `where` optional so callers can request paginated lists without filters.
export interface IUserQueryParameters extends IQueryParameters {
    where?: { email?: string } | { id?: string };
}

export interface IUserRepository {
    listUsers(): Promise<User[]>;
    getUser(param: { where: { id: number } | { email: string } }): Promise<User | null>;
    getUsers(params: IUserQueryParameters): Promise<User[]>;
    createUser(payload: Partial<NewUser>): Promise<User>;
    updateUser(id: number, payload: Partial<NewUser>): Promise<User>;
    deleteUser(param: { where: { id?: number; email?: string } }): Promise<void>;
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

    async getUser(param: { where: { id?: number; email?: string } }): Promise<User | null> {
        const db = this.getDb();
        if (param.where.id) {
            const user = await db.select().from(users).where(eq(users.id, param.where.id)).limit(1).execute();
            return (user[0] ?? null) as unknown as User | null;
        }
        if (param.where.email) {
            const user = await db.select().from(users).where(eq(users.email, param.where.email)).limit(1).execute();
            return (user[0] ?? null) as unknown as User | null;
        }
        return null;
    }

    async getUsers(params: IUserQueryParameters): Promise<User[]> {
        const db = this.getDb();
        const limit = params.limit ?? this.defaultLimit;
        const offset = params.offset ?? this.defaultOffset;
        if (params.where && "email" in params.where && params.where.email) {
            const list = await db.select().from(users).where(eq(users.email, params.where.email)).limit(limit).offset(offset).execute();
            return list as unknown as User[];
        }
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

    async deleteUser(param: { where: { id?: number; email?: string } }): Promise<void> {
        const db = this.getDb();
        if (param.where.id) {
            await db.delete(users).where(eq(users.id, param.where.id)).execute();
            return;
        }
        if (param.where.email) {
            await db.delete(users).where(eq(users.email, param.where.email)).execute();
            return;
        }
    }
}