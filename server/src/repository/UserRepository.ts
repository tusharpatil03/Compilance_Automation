import { users } from "../models/User";
import { BaseRepository } from "./BaseRepository";
import { User, NewUser, IUserRepository, IUserQueryParameters } from "./Repositorty";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";

// Concrete repository for `users` table. It receives a typed Drizzle DB instance
// (created at app bootstrap) and operates on the `users` table.
export class UserRepository extends BaseRepository<typeof users, any> implements IUserRepository {
    constructor(db: NodePgDatabase<any>) {
        super(db, users);
    }

    async createUser(payload: Partial<NewUser>): Promise<User> {
        const db = this.getDb();
    // payload may be partial; cast to any to satisfy Drizzle overloads.
    const [newUser] = await db.insert(users).values(payload as any).returning();
    return newUser as unknown as User;
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
    const [updated] = await db.update(users).set(payload as any).where(eq(users.id, id)).returning();
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