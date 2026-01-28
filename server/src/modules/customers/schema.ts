import { AnyPgColumn, integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { tenants } from "../tenant/schema";

export const users = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenant_id: integer().notNull().references((): AnyPgColumn => tenants.id),
    external_customer_id: varchar().notNull(),
    name: varchar().notNull(),
    phone: varchar().notNull(),
    risk_score: integer().notNull().default(0),
    status: varchar().notNull().default("active"),
    created_at: integer().notNull(),
    updated_at: integer().notNull()
});

export const documents = pgTable("documents", {
    user_id: integer().unique().references((): AnyPgColumn => users.id),
    adhar_url: varchar(),
    pan_url: varchar(),
    driving_license_url: varchar()
})