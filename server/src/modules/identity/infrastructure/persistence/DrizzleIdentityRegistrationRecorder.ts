import type { IdentityRegistrationRecorder } from '../../application/ports/IdentityRegistrationRecorder';
import type { Identity } from '../../domain/entities/Identity';
import {
    IdentityProfileHistoryRepository,
    IdentityProfileRepository,
    IdentityStatusHistoryRepository,
} from './LegacyIdentityRepository';
import type { DrizzleClient } from '../../../../repositories/BaseRepository';

export class DrizzleIdentityRegistrationRecorder
    implements IdentityRegistrationRecorder {
    private readonly profileRepository: IdentityProfileRepository;
    private readonly profileHistoryRepository: IdentityProfileHistoryRepository;
    private readonly statusHistoryRepository: IdentityStatusHistoryRepository;

    constructor(db: DrizzleClient) {
        this.profileRepository = new IdentityProfileRepository(db);
        this.profileHistoryRepository = new IdentityProfileHistoryRepository(db);
        this.statusHistoryRepository = new IdentityStatusHistoryRepository(db);
    }

    async record(identity: Identity, fullName?: string): Promise<void> {
        const snapshot = identity.snapshot;
        const now = snapshot.createdAt.toISOString();

        await this.profileRepository.upsertProfile(identity.id, {
            identity_id: identity.id,
            full_name: fullName ?? null,
            date_of_birth: null,
            address_line1: null,
            address_line2: null,
            city: null,
            country: null,
            postal_code: null,
            updated_at: now,
        });

        if (fullName) {
            await this.profileHistoryRepository.createHistory({
                identity_id: identity.id,
                field_name: 'full_name',
                old_value: null,
                new_value: fullName,
                changed_by: identity.id,
                changed_at: now,
            });
        }

        await this.statusHistoryRepository.createHistory({
            identity_id: identity.id,
            status_type: 'account_status',
            from_status: null,
            to_status: snapshot.accountStatus,
            reason: 'Identity created',
            changed_by: null,
            created_at: now,
        });

        await this.statusHistoryRepository.createHistory({
            identity_id: identity.id,
            status_type: 'verification_status',
            from_status: null,
            to_status: snapshot.verificationStatus,
            reason: 'Identity created',
            changed_by: null,
            created_at: now,
        });
    }
}
