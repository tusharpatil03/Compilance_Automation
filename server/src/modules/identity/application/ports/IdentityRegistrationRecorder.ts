import type { Identity } from '../../domain/entities/Identity';

export interface IdentityRegistrationRecorder {
    record(identity: Identity, fullName: string | undefined): Promise<void>;
}
