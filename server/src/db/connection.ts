import 'dotenv/config';
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import schema, { AppSchema } from "./schema";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL as string,
});
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment; cannot initialize DB connection');
}

// Provide the compiled schema to drizzle so runtime queries match the
// application's schema types and generated SQL. This prevents mismatches
// between the Drizzle table definitions and the actual DB queries.
export const db = drizzle({ client: pool, schema });