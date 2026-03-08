import { pgEnum, integer, pgTable, varchar, AnyPgColumn, timestamp, uniqueIndex, index, jsonb } from "drizzle-orm/pg-core";


export const event_store = pgTable("event_store", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    tenant_id: integer().notNull(),
    aggregate_id: integer().notNull(),
    event_type: varchar({ length: 255 }).notNull(),
    payload: jsonb("payload").notNull(),
    metadata: jsonb("metadata").notNull(),
    occurred_at: timestamp({ mode: "string" }).notNull().defaultNow(),
});

export type EventStoreRecord = typeof event_store.$inferSelect;
export type NewEventStoreRecord = typeof event_store.$inferInsert;

export const outbox = pgTable("outbox", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    event_id: integer().notNull().references((): AnyPgColumn => event_store.id),
    event_type: varchar({ length: 255 }).notNull(),
    tenant_id: integer().notNull(),
    payload: jsonb("payload").notNull(),
    aggregate_id: integer().notNull(),
    metadata: jsonb("metadata").notNull(),
    occurred_at: timestamp({ mode: "string" }).notNull().defaultNow(),
    processed_at: timestamp({ mode: "string" }),
    processed: integer().notNull().default(0), //for retry mechanism
}, (table) => {
    return {
        tenantEventIdx: index("ix_outbox_tenant_event").on(table.tenant_id, table.event_type),
        processedAtIdx: index("ix_outbox_processed_at").on(table.processed_at),
    };
});

export type OutboxRecord = typeof outbox.$inferSelect;
export type NewOutboxRecord = typeof outbox.$inferInsert;