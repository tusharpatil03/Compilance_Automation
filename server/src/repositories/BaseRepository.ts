import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PgTable } from "drizzle-orm/pg-core";

export type DrizzleClient = NodePgDatabase<any>;

export class BaseRepository<T extends PgTable> {
    protected defaultLimit = 10;
    protected defaultOffset = 0;

    // The repository no longer constructs the DB; it receives a typed instance.
    protected readonly db: NodePgDatabase<any>;
    protected readonly table: T;

    constructor(db: NodePgDatabase<any>, table: T) {
        this.db = db;
        this.table = table;
    }

    protected getDb() {
        return this.db;
    }

    protected normalizePagination(options?: { limit?: number; offset?: number }) {
        const limit = Math.min(Math.max(options?.limit ?? this.defaultLimit, 1), 100);
        const offset = Math.max(options?.offset ?? this.defaultOffset, 0);
        return { limit, offset };
    }
}

export type Constructor<T = {}> = new (...args: any[]) => T;