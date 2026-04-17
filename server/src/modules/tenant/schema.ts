// tenant model schema
import { pgEnum, integer, pgTable, varchar, AnyPgColumn, timestamp, uniqueIndex, index, jsonb } from "drizzle-orm/pg-core";

// Status used for tenants and keys
export const TenantStatus = pgEnum("tenant_status", ["active", "inactive", "suspended"]);
export const ApiKeyStatus = pgEnum("apikey_status", ["active", "inactive", "revoked"]);

export type TenantStatus = (typeof TenantStatus.enumValues)[number];
export type ApiKeyStatus = (typeof ApiKeyStatus.enumValues)[number];

export const tenants = pgTable("tenants", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(), // internal surrogate key

    //business identifiers - unique and used for login and API key association
    name: varchar({ length: 255 }).notNull().unique(),
    email: varchar({ length: 255 }).notNull().unique(),

    // authentication fields - store hashed password and salt for secure authentication
    password: varchar({ length: 255 }).notNull(),
    salt: varchar({ length: 255 }).notNull(),

    status: TenantStatus("status").notNull().default("active"), // tenant status for account management

    // audit fields
    created_at: timestamp({ mode: "string" }).notNull().defaultNow(),
    updated_at: timestamp({ mode: "string" }).notNull().defaultNow(),
});

// define types
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

// API keys table - supports multiple keys per tenant, hashed storage, rotation and revocation
export const tenants_api_key = pgTable("tenants_api_keys", {
    // surrogate primary key for the key record
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    // foreign key to tenant - ensures keys are associated with a valid tenant
    tenant_id: integer().notNull().references((): AnyPgColumn => tenants.id),

    // store encrypted api key
    api_key: varchar({ length: 255 }).notNull(),

    // hashed key material - never store raw keys
    api_key_hash: varchar({ length: 512 }).notNull(),
    key_prefix: varchar({ length: 20 }).notNull(),  // business identifier for the key

    status: ApiKeyStatus("status").notNull().default("active"),

    created_at: timestamp({ mode: "string" }).notNull().defaultNow(),
    updated_at: timestamp({ mode: "string" }).notNull().defaultNow(),
    expires_at: timestamp({ mode: "string" }),
    revoked_at: timestamp({ mode: "string" }),
    rotated_from_key_id: integer().references((): AnyPgColumn => tenants_api_key.id),
}, (table) => {
    return {
        // composite unique key_prefix to prevent duplicate key prefixes within the same tenant
        uniqueKey: uniqueIndex("tenant_keyprefix").on(table.tenant_id, table.key_prefix),

        // Speed up lookups by tenant and common filters
        tenantIdx: index("ix_tenantapikey_tenant").on(table.tenant_id),
    };
});

export type TenantApiKey = typeof tenants_api_key.$inferSelect;
export type NewTenantApiKey = typeof tenants_api_key.$inferInsert;


export const webhooks = pgTable("webhooks", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenant_id: integer().notNull().references((): AnyPgColumn => tenants.id),
    url: varchar({ length: 2048 }).notNull(),
    events: jsonb("events").notNull(), // array of event types this webhook subscribes to
    secret: varchar({ length: 255 }).notNull(), // secret for signing webhook payloads
    created_at: timestamp({ mode: "string" }).notNull().defaultNow(),
    updated_at: timestamp({ mode: "string" }).notNull().defaultNow(),
});

export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;