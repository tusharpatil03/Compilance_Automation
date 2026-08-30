import type { IdentityProps } from '../../domain/entities/Identity';

export type VerificationResult = {
    identity: IdentityProps;
    verifiedChannel: 'EMAIL' | 'SMS';
};
