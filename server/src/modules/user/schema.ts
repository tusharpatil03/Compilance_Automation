import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenant_id: integer().notNull(),
    external_customer_id: varchar().notNull(),
    email: varchar().notNull().unique(),
    password: varchar().notNull(),
    salt: varchar().notNull(),
    name: varchar().notNull(),
    phone: varchar().notNull(),
    role: varchar().notNull(),
    risk_score: integer().notNull().default(0),
    status: varchar().notNull().default("active"),
    created_at: integer().notNull(),
    updated_at: integer().notNull(),
});
