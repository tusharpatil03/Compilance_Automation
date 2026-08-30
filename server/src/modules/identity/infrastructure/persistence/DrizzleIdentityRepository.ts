import { Identity } from '../../domain/entities/Identity';
import type { IdentityRepository } from '../../domain/repositories/IdentityRepository';
import {
    IdentityRepository as LegacyIdentityRepository,
} from './LegacyIdentityRepository';
import type { Identity as IdentityRow } from './schema';
import type { DrizzleClient } from '../../../../repositories/BaseRepository';

function toDomain(row: IdentityRow): Identity {
    return Identity.reconstitute({
        id: row.id,
        email: row.email,
        phoneNumber: row.phone_number,
        accountStatus: row.account_status,
        verificationStatus: row.verification_status,
        trustScore: row.trust_score === null ? null : Number(row.trust_score),
        riskScore: row.risk_score === null ? null : Number(row.risk_score),
        riskRating: row.risk_rating,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    });
}

export class DrizzleIdentityRepository implements IdentityRepository {
    private readonly repository: LegacyIdentityRepository;

    constructor(db: DrizzleClient) {
        this.repository = new LegacyIdentityRepository(db);
    }

    async findById(id: string): Promise<Identity | null> {
        const row = await this.repository.getById(id);
        return row ? toDomain(row) : null;
    }

    async findByContact(
        email?: string | null,
        phoneNumber?: string | null
    ): Promise<Identity | null> {
        const row = await this.repository.findByEmailOrPhone(email, phoneNumber);
        return row ? toDomain(row) : null;
    }

    async save(identity: Identity): Promise<Identity> {
        const current = await this.repository.getById(identity.id);
        const snapshot = identity.snapshot;

        if (!current) {
            const created = await this.repository.createIdentity({
                id: snapshot.id,
                email: snapshot.email,
                phone_number: snapshot.phoneNumber,
                account_status: snapshot.accountStatus,
                verification_status: snapshot.verificationStatus,
                trust_score: snapshot.trustScore?.toString() ?? null,
                risk_score: snapshot.riskScore?.toString() ?? null,
                risk_rating: snapshot.riskRating,
                created_at: snapshot.createdAt.toISOString(),
                updated_at: snapshot.updatedAt.toISOString(),
            });
            return toDomain(created);
        }

        let updated = current;
        if (current.account_status !== snapshot.accountStatus) {
            updated = await this.repository.updateAccountStatus(
                identity.id,
                snapshot.accountStatus
            );
        }
        if (updated.verification_status !== snapshot.verificationStatus) {
            updated = await this.repository.updateVerificationStatus(
                identity.id,
                snapshot.verificationStatus
            );
        }
        return toDomain(updated);
    }
}
