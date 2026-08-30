import { describe, expect, it } from '@jest/globals';
import { Identity } from '../../../../../src/modules/identity/domain/entities/Identity';

describe('Identity aggregate', () => {
    it('registers with an email or phone number', () => {
        const identity = Identity.register({
            id: 'identity-1',
            email: 'person@example.com',
        });

        expect(identity.snapshot).toMatchObject({
            id: 'identity-1',
            email: 'person@example.com',
            phoneNumber: null,
            accountStatus: 'REGISTERED',
            verificationStatus: 'UNVERIFIED',
        });
    });

    it('rejects registration without a contact method', () => {
        expect(() => Identity.register({ id: 'identity-1' })).toThrow(
            'Identity requires an email or phone number'
        );
    });

    it('transitions an active identity to verified', () => {
        const identity = Identity.register({
            id: 'identity-1',
            phoneNumber: '+15555550100',
        });

        identity.verify();

        expect(identity.verificationStatus).toBe('VERIFIED');
    });

    it('does not verify a deactivated identity', () => {
        const identity = Identity.reconstitute({
            ...Identity.register({
                id: 'identity-1',
                email: 'person@example.com',
            }).snapshot,
            accountStatus: 'DEACTIVATED',
        });

        expect(() => identity.verify()).toThrow(
            'Deactivated identities cannot be verified'
        );
    });
});
