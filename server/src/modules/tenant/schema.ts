// tenant model schema
import { pgEnum, integer, pgTable, varchar, AnyPgColumn, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

// Status used for tenants and keys
export const TenantStatus = pgEnum("tenant_status", ["active", "inactive", "suspended"]);

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
export const tenants_api_key = pgTable("tenants_api_keys", {
    // surrogate primary key for the key record
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    
    tenant_id: integer().notNull().references((): AnyPgColumn => tenants.id),
    // key id (KID) stored in plaintext so clients can reference a key without exposing the secret
    kid: varchar({ length: 128 }).notNull(),
    // hashed key material - never store raw keys
    api_key_hash: varchar({ length: 512 }).notNull(),
    label: varchar({ length: 255 }).default(""),
    status: TenantStatus("status").notNull().default("active"),
    
    created_at: timestamp({ mode: "string" }).notNull().defaultNow(),
    updated_at: timestamp({ mode: "string" }).notNull().defaultNow(),
    last_used_at: timestamp({ mode: "string" }),
    expires_at: timestamp({ mode: "string" }),
    revoked_at: timestamp({ mode: "string" }),
    rotated_from_key_id: integer().references((): AnyPgColumn => tenants_api_key.id),
}, (table) => {
    return {
        // Ensure each kid is unique globally
        kidUniqueIdx: uniqueIndex("ux_tenantapikey_kid").on(table.kid),
        // Speed up lookups by tenant and common filters
        tenantIdx: index("ix_tenantapikey_tenant").on(table.tenant_id),
        tenantStatusIdx: index("ix_tenantapikey_tenant_status").on(table.tenant_id, table.status),
        expiresIdx: index("ix_tenantapikey_expires").on(table.expires_at),
    };
});

export type TenantApiKey = typeof tenants_api_key.$inferSelect;
export type NewTenantApiKey = typeof tenants_api_key.$inferInsert;