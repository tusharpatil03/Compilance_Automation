import { AnyPgColumn, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { tenants } from "../tenant/schema";


export const users = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenant_id: integer().notNull().references((): AnyPgColumn => tenants.id),
    external_customer_id: varchar().notNull(),
    name: varchar().notNull(),
    email: varchar().notNull(),
    phone: varchar().notNull(),
    risk_profile_id: integer().references((): AnyPgColumn => users.id),
    status: varchar().notNull().default("active"),
    created_at: timestamp({ mode: "string" }).notNull().defaultNow(),
    updated_at: timestamp({ mode: "string" }).notNull().defaultNow()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const risk_profile = pgTable("risk_profile", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    user_id: integer().notNull().references((): AnyPgColumn => users.id),
    risk_score: integer().notNull().default(0),
    created_at: timestamp({ mode: "string" }).notNull().defaultNow(),
    updated_at: timestamp({ mode: "string" }).notNull().defaultNow()
});

export type RiskProfile = typeof risk_profile.$inferSelect;
export type NewRiskProfile = typeof risk_profile.$inferInsert;