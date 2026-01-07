import 'dotenv/config';
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
});

export { pool };

export const db: NodePgDatabase<any> = drizzle(pool);