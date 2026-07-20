import {
  AnyPgColumn,
  integer,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { tenants } from '../tenant/schema';

export const customers = pgTable('customers', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tenant_id: integer()
    .notNull()
    .references((): AnyPgColumn => tenants.id),
  external_customer_id: varchar().notNull(),
  name: varchar().notNull(),
  email: varchar().notNull(),
  phone: varchar().notNull(),
  risk_profile_id: integer().references((): AnyPgColumn => customers.id),
  status: varchar().notNull().default('active'),
  created_at: timestamp({ mode: 'string' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'string' }).notNull().defaultNow(),
});

export type User = typeof customers.$inferSelect;
export type NewUser = typeof customers.$inferInsert;

export const risk_profile = pgTable('risk_profile', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer()
    .notNull()
    .references((): AnyPgColumn => customers.id),
  risk_score: integer().notNull().default(0),
  created_at: timestamp({ mode: 'string' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'string' }).notNull().defaultNow(),
});

export type RiskProfile = typeof risk_profile.$inferSelect;
export type NewRiskProfile = typeof risk_profile.$inferInsert;

export const documents = pgTable('documents', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer()
    .notNull()
    .references((): AnyPgColumn => customers.id),
  tenant_id: integer()
    .notNull()
    .references((): AnyPgColumn => tenants.id),
  document_type: varchar().notNull(),
  document_url: varchar().notNull(),
  status: varchar().notNull().default('pending'),
  created_at: timestamp({ mode: 'string' }).notNull().defaultNow(),
  updated_at: timestamp({ mode: 'string' }).notNull().defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
