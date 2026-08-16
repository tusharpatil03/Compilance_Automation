import { eq, or } from 'drizzle-orm';
import { BaseRepository } from '../../repositories/BaseRepository';
import type { DrizzleClient } from '../../repositories/BaseRepository';
import {
  identities,
  identityProfiles,
  identityProfileHistory,
  identityStatusHistory,
  otpCodes,
  type Identity,
  type NewIdentity,
  type IdentityProfile,
  type NewIdentityProfile,
  type IdentityProfileHistory,
  type NewIdentityProfileHistory,
  type IdentityStatusHistory,
  type NewIdentityStatusHistory,
  type OtpCode,
  type NewOtpCode,
} from './schema';

export class IdentityRepository extends BaseRepository<typeof identities> {
  constructor(db: DrizzleClient) {
    super(db, identities);
  }

  async findByEmailOrPhone(
    email?: string | null,
    phoneNumber?: string | null
  ): Promise<Identity | null> {
    if (!email && !phoneNumber) {
      return null;
    }

    const db = this.getDb();
    const clauses = [] as Array<any>;

    if (email) {
      clauses.push(eq(identities.email, email));
    }
    if (phoneNumber) {
      clauses.push(eq(identities.phone_number, phoneNumber));
    }

    const result = await db
      .select()
      .from(identities)
      .where(clauses.length > 1 ? or(...clauses) : clauses[0])
      .limit(1)
      .execute();

    return (result[0] ?? null) as Identity | null;
  }

  async getById(id: string): Promise<Identity | null> {
    const db = this.getDb();
    const result = await db
      .select()
      .from(identities)
      .where(eq(identities.id, id))
      .limit(1)
      .execute();
    return (result[0] ?? null) as Identity | null;
  }

  async createIdentity(payload: NewIdentity): Promise<Identity> {
    const db = this.getDb();
    const [created] = await db.insert(identities).values(payload).returning();
    return created as Identity;
  }

  async updateAccountStatus(
    id: string,
    status: Identity['account_status']
  ): Promise<Identity> {
    const db = this.getDb();
    const [updated] = await db
      .update(identities)
      .set({ account_status: status, updated_at: new Date().toISOString() })
      .where(eq(identities.id, id))
      .returning();
    return updated as Identity;
  }

  async updateVerificationStatus(
    id: string,
    status: Identity['verification_status']
  ): Promise<Identity> {
    const db = this.getDb();
    const [updated] = await db
      .update(identities)
      .set({ verification_status: status, updated_at: new Date().toISOString() })
      .where(eq(identities.id, id))
      .returning();
    return updated as Identity;
  }
}

export class IdentityProfileRepository extends BaseRepository<typeof identityProfiles> {
  constructor(db: DrizzleClient) {
    super(db, identityProfiles);
  }

  async upsertProfile(
    identityId: string,
    payload: NewIdentityProfile
  ): Promise<IdentityProfile> {
    const db = this.getDb();
    const existing = await db
      .select()
      .from(identityProfiles)
      .where(eq(identityProfiles.identity_id, identityId))
      .limit(1)
      .execute();

    if (existing[0]) {
      const [updated] = await db
        .update(identityProfiles)
        .set({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .where(eq(identityProfiles.identity_id, identityId))
        .returning();
      return updated as IdentityProfile;
    }

    const [created] = await db
      .insert(identityProfiles)
      .values({
        ...payload,
        identity_id: identityId,
        updated_at: new Date().toISOString(),
      })
      .returning();
    return created as IdentityProfile;
  }
}

export class IdentityProfileHistoryRepository extends BaseRepository<typeof identityProfileHistory> {
  constructor(db: DrizzleClient) {
    super(db, identityProfileHistory);
  }

  async createHistory(
    payload: NewIdentityProfileHistory
  ): Promise<IdentityProfileHistory> {
    const db = this.getDb();
    const [created] = await db
      .insert(identityProfileHistory)
      .values(payload)
      .returning();
    return created as IdentityProfileHistory;
  }
}

export class IdentityStatusHistoryRepository extends BaseRepository<typeof identityStatusHistory> {
  constructor(db: DrizzleClient) {
    super(db, identityStatusHistory);
  }

  async createHistory(
    payload: NewIdentityStatusHistory
  ): Promise<IdentityStatusHistory> {
    const db = this.getDb();
    const [created] = await db
      .insert(identityStatusHistory)
      .values(payload)
      .returning();
    return created as IdentityStatusHistory;
  }
}

export class OtpCodeRepository extends BaseRepository<typeof otpCodes> {
  constructor(db: DrizzleClient) {
    super(db, otpCodes);
  }

  async createOtpCode(payload: NewOtpCode): Promise<OtpCode> {
    const db = this.getDb();
    const [created] = await db.insert(otpCodes).values(payload).returning();
    return created as OtpCode;
  }
}
