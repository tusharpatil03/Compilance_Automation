// tenant model schema
import { pgEnum, integer, pgTable, varchar, AnyPgColumn, timestamp } from "drizzle-orm/pg-core";

// Status used for tenants and keys
export const TenantStatus = pgEnum("tenant_status", ["active", "inactive", "suspended"]);

// Environments for API keys to support staging/prod separation
export const KeyEnvironment = pgEnum("key_environment", ["production", "staging", "development"]);

export const tenants = pgTable("tenants", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull().unique(),
    email: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 255 }).notNull(),
    salt: varchar({ length: 255 }).notNull(),
    status: TenantStatus("status").notNull().default("active"),
    created_at: timestamp({ mode: "string" }).notNull().defaultNow(),
    updated_at: timestamp({ mode: "string" }).notNull().defaultNow(),
});

// define types
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

// API keys table - supports multiple keys per tenant, hashed storage, rotation and revocation
export const tenants_api_keys = pgTable("tenants_api_keys", {
    // surrogate primary key for the key record
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    
    tenant_id: integer().notNull().references((): AnyPgColumn => tenants.id),
    // key id (KID) stored in plaintext so clients can reference a key without exposing the secret
    kid: varchar({ length: 128 }).notNull(),
    // hashed key material - never store raw keys
    api_key_hash: varchar({ length: 512 }).notNull(),
    label: varchar({ length: 255 }).default(""),
    environment: KeyEnvironment("environment").notNull().default("production"),
    status: TenantStatus("status").notNull().default("active"),
    
    created_at: timestamp({ mode: "string" }).notNull().defaultNow(),
    last_used_at: timestamp({ mode: "string" }),
    expires_at: timestamp({ mode: "string" }),
    revoked_at: timestamp({ mode: "string" }),
    rotated_from_key_id: integer().references((): AnyPgColumn => tenants_api_keys.id),
});

export type TenantApiKey = typeof tenants_api_keys.$inferSelect;
export type NewTenantApiKey = typeof tenants_api_keys.$inferInsert;

// // events / audit log for API key lifecycle changes - provides auditability and immutability
// export const tenants_api_key_events = pgTable("tenants_api_key_events", {
//     id: integer().primaryKey().generatedAlwaysAsIdentity(),
//     tenant_id: integer().notNull().references((): AnyPgColumn => tenants.id),
//     api_key_id: integer().notNull().references((): AnyPgColumn => tenants_api_keys.id),
//     event_type: varchar({ length: 64 }).notNull(), // e.g. created, rotated, revoked, used
//     event_meta: varchar({ length: 2048 }).default(""), // optional JSON string or metadata
//     created_at: timestamp({ mode: "string" }).notNull().defaultNow(),
//     actor_id: varchar({ length: 128 }).default(""), // system or user id that triggered change
// });

// export type TenantApiKeyEvent = typeof tenants_api_key_events.$inferSelect;