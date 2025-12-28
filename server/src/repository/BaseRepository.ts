import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PgTable } from "drizzle-orm/pg-core";

// Keep BaseRepository minimal and accept a ready-to-use typed database instance.
// This avoids multiple repositories creating their own connections and lets
// the application bootstrap the DB once (better for testing and lifecycle).
export class BaseRepository<T extends PgTable, DB extends Record<string, unknown> = Record<string, unknown>> {
    protected defaultLimit = 10;
    protected defaultOffset = 0;

    // The repository no longer constructs the DB; it receives a typed instance.
    protected readonly db: NodePgDatabase<DB>;
    protected readonly table: T;

    constructor(db: NodePgDatabase<DB>, table: T) {
        this.db = db;
        this.table = table;
    }

    protected getDb() {
        return this.db;
    }
}

export type Constructor<T = {}> = new (...args: any[]) => T;