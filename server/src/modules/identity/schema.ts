import {
    AnyPgColumn,
    date,
    integer,
    jsonb,
    numeric,
    pgEnum,
    pgTable,
    smallint,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';

export const accountStatusEnum = pgEnum('account_status', [
    'REGISTERED',
    'ACTIVE',
    'SUSPENDED',
    'DEACTIVATED',
]);

export const identityVerificationStatusEnum = pgEnum(
    'identity_verification_status',
    ['UNVERIFIED', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'EXPIRED']
);

export const documentStatusEnum = pgEnum('document_status', [
    'UPLOADED',
    'PROCESSING',
    'EXTRACTED',
    'VERIFIED',
    'REJECTED',
    'SUPERSEDED',
]);

export const verificationStageEnum = pgEnum('verification_stage', [
    'FORMAT_CHECK',
    'GOVERNMENT_VERIFICATION',
    'FACE_MATCH',
    'LIVENESS_DETECTION',
]);

export const verificationStatusEnum = pgEnum('verification_status', [
    'PENDING',
    'IN_PROGRESS',
    'APPROVED',
    'REJECTED',
    'MANUAL_REVIEW',
]);

export const stageResultEnum = pgEnum('stage_result', [
    'PENDING',
    'PASSED',
    'FAILED',
    'SKIPPED',
]);

export const otpPurposeEnum = pgEnum('otp_purpose', [
    'REGISTRATION',
    'LOGIN',
    'PASSWORD_RESET',
]);

export const otpChannelEnum = pgEnum('otp_channel', ['EMAIL', 'SMS']);

export const tokenTypeEnum = pgEnum('token_type', ['JWT', 'PASETO']);

export const identities = pgTable(
    'identities',
    {
        id: uuid().primaryKey().defaultRandom(),
        email: varchar({ length: 255 }),
        phone_number: varchar({ length: 20 }),
        account_status: accountStatusEnum('account_status')
            .notNull()
            .default('REGISTERED'),
        verification_status: identityVerificationStatusEnum('verification_status')
            .notNull()
            .default('UNVERIFIED'),
        trust_score: numeric({ precision: 5, scale: 2 }),
        risk_score: numeric({ precision: 5, scale: 2 }),
        risk_rating: varchar({ length: 16 }),
        created_at: timestamp({ mode: 'string', withTimezone: true })
            .notNull()
            .defaultNow(),
        updated_at: timestamp({ mode: 'string', withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => ({
        emailUnique: uniqueIndex('identities_email_unique').on(table.email),
        phoneUnique: uniqueIndex('identities_phone_unique').on(table.phone_number),
    })
);

export type Identity = typeof identities.$inferSelect;
export type NewIdentity = typeof identities.$inferInsert;

export const identityProfiles = pgTable('identity_profiles', {
    identity_id: uuid()
        .primaryKey()
        .references((): AnyPgColumn => identities.id, { onDelete: 'cascade' }),
    full_name: varchar({ length: 255 }),
    date_of_birth: date({ mode: 'string' }),
    address_line1: varchar({ length: 255 }),
    address_line2: varchar({ length: 255 }),
    city: varchar({ length: 100 }),
    country: varchar({ length: 2 }),
    postal_code: varchar({ length: 20 }),
    updated_at: timestamp({ mode: 'string', withTimezone: true })
        .notNull()
        .defaultNow(),
});

export type IdentityProfile = typeof identityProfiles.$inferSelect;
export type NewIdentityProfile = typeof identityProfiles.$inferInsert;

export const identityProfileHistory = pgTable('identity_profile_history', {
    id: uuid().primaryKey().defaultRandom(),
    identity_id: uuid()
        .notNull()
        .references((): AnyPgColumn => identities.id, { onDelete: 'cascade' }),
    field_name: varchar({ length: 100 }).notNull(),
    old_value: text(),
    new_value: text(),
    changed_by: uuid().notNull(),
    changed_at: timestamp({ mode: 'string', withTimezone: true })
        .notNull()
        .defaultNow(),
});

export type IdentityProfileHistory = typeof identityProfileHistory.$inferSelect;
export type NewIdentityProfileHistory = typeof identityProfileHistory.$inferInsert;

export const identityStatusHistory = pgTable('identity_status_history', {
    id: uuid().primaryKey().defaultRandom(),
    identity_id: uuid()
        .notNull()
        .references((): AnyPgColumn => identities.id, { onDelete: 'cascade' }),
    status_type: varchar({ length: 30 }).notNull(),
    from_status: varchar({ length: 30 }),
    to_status: varchar({ length: 30 }).notNull(),
    reason: text(),
    changed_by: uuid(),
    created_at: timestamp({ mode: 'string', withTimezone: true })
        .notNull()
        .defaultNow(),
});

export type IdentityStatusHistory = typeof identityStatusHistory.$inferSelect;
export type NewIdentityStatusHistory = typeof identityStatusHistory.$inferInsert;

export const credentials = pgTable('credentials', {
    id: uuid().primaryKey().defaultRandom(),
    identity_id: uuid()
        .notNull()
        .references((): AnyPgColumn => identities.id, { onDelete: 'cascade' }),
    password_hash: text().notNull(),
    password_updated_at: timestamp({ mode: 'string', withTimezone: true })
        .notNull()
        .defaultNow(),
    created_at: timestamp({ mode: 'string', withTimezone: true })
        .notNull()
        .defaultNow(),
});

export type Credential = typeof credentials.$inferSelect;
export type NewCredential = typeof credentials.$inferInsert;

export const otpCodes = pgTable('otp_codes', {
    id: uuid().primaryKey().defaultRandom(),
    identity_id: uuid()
        .notNull()
        .references((): AnyPgColumn => identities.id, { onDelete: 'cascade' }),
    purpose: otpPurposeEnum('purpose').notNull(),
    channel: otpChannelEnum('channel').notNull(),
    code_hash: text().notNull(),
    attempts: smallint().notNull().default(0),
    max_attempts: smallint().notNull().default(5),
    expires_at: timestamp({ mode: 'string', withTimezone: true }).notNull(),
    consumed_at: timestamp({ mode: 'string', withTimezone: true }),
    created_at: timestamp({ mode: 'string', withTimezone: true })
        .notNull()
        .defaultNow(),
});

export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;

export const sessions = pgTable('sessions', {
    id: uuid().primaryKey().defaultRandom(),
    identity_id: uuid()
        .notNull()
        .references((): AnyPgColumn => identities.id, { onDelete: 'cascade' }),
    token_type: tokenTypeEnum('token_type').notNull(),
    token_id: varchar({ length: 255 }).notNull().unique(),
    issued_at: timestamp({ mode: 'string', withTimezone: true })
        .notNull()
        .defaultNow(),
    expires_at: timestamp({ mode: 'string', withTimezone: true }).notNull(),
    revoked_at: timestamp({ mode: 'string', withTimezone: true }),
    ip_address: varchar({ length: 64 }),
    user_agent: text(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export const documents = pgTable('documents', {
    id: uuid().primaryKey().defaultRandom(),
    identity_id: uuid()
        .notNull()
        .references((): AnyPgColumn => identities.id, { onDelete: 'cascade' }),
    document_type: varchar({ length: 50 }).notNull(),
    current_version_id: uuid(),
    created_at: timestamp({ mode: 'string', withTimezone: true })
        .notNull()
        .defaultNow(),
    updated_at: timestamp({ mode: 'string', withTimezone: true })
        .notNull()
        .defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export const documentVersions = pgTable('document_versions', {
    id: uuid().primaryKey().defaultRandom(),
    document_id: uuid()
        .notNull()
        .references((): AnyPgColumn => documents.id, { onDelete: 'cascade' }),
    version_number: integer().notNull(),
    storage_ref: text().notNull(),
    status: documentStatusEnum('status').notNull().default('UPLOADED'),
    uploaded_by: uuid()
        .notNull()
        .references((): AnyPgColumn => identities.id),
    uploaded_at: timestamp({ mode: 'string', withTimezone: true })
        .notNull()
        .defaultNow(),
});

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type NewDocumentVersion = typeof documentVersions.$inferInsert;

export const documentExtractions = pgTable('document_extractions', {
    id: uuid().primaryKey().defaultRandom(),
    document_version_id: uuid()
        .notNull()
        .references((): AnyPgColumn => documentVersions.id, { onDelete: 'cascade' }),
    extracted_fields: jsonb().notNull(),
    ocr_confidence: numeric({ precision: 5, scale: 4 }),
    processed_at: timestamp({ mode: 'string', withTimezone: true })
        .notNull()
        .defaultNow(),
});

export type DocumentExtraction = typeof documentExtractions.$inferSelect;
export type NewDocumentExtraction = typeof documentExtractions.$inferInsert;

export const verifications = pgTable('verifications', {
    id: uuid().primaryKey().defaultRandom(),
    identity_id: uuid()
        .notNull()
        .references((): AnyPgColumn => identities.id, { onDelete: 'cascade' }),
    document_id: uuid().references((): AnyPgColumn => documents.id),
    status: verificationStatusEnum('status').notNull().default('PENDING'),
    started_at: timestamp({ mode: 'string', withTimezone: true })
        .notNull()
        .defaultNow(),
    completed_at: timestamp({ mode: 'string', withTimezone: true }),
});

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;

export const verificationStageResults = pgTable(
    'verification_stage_results',
    {
        id: uuid().primaryKey().defaultRandom(),
        verification_id: uuid()
            .notNull()
            .references((): AnyPgColumn => verifications.id, { onDelete: 'cascade' }),
        stage: verificationStageEnum('stage').notNull(),
        result: stageResultEnum('result').notNull().default('PENDING'),
        details: jsonb(),
        started_at: timestamp({ mode: 'string', withTimezone: true }),
        completed_at: timestamp({ mode: 'string', withTimezone: true }),
    },
    (table) => ({
        verificationStageUnique: uniqueIndex('verification_stage_unique').on(
            table.verification_id,
            table.stage
        ),
    })
);

export type VerificationStageResult = typeof verificationStageResults.$inferSelect;
export type NewVerificationStageResult =
    typeof verificationStageResults.$inferInsert;

export const identitySchema = {
    accountStatusEnum,
    identityVerificationStatusEnum,
    documentStatusEnum,
    verificationStageEnum,
    verificationStatusEnum,
    stageResultEnum,
    otpPurposeEnum,
    otpChannelEnum,
    tokenTypeEnum,
    identities,
    identityProfiles,
    identityProfileHistory,
    identityStatusHistory,
    credentials,
    otpCodes,
    sessions,
    documents,
    documentVersions,
    documentExtractions,
    verifications,
    verificationStageResults,
};
