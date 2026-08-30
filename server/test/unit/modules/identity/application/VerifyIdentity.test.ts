import { describe, expect, it } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { VerifyIdentity } from '../../../../../src/modules/identity/application/use-cases/VerifyIdentity';
import { Identity } from '../../../../../src/modules/identity/domain/entities/Identity';
import type { IdentityRepository } from '../../../../../src/modules/identity/domain/repositories/IdentityRepository';
import type {
    OtpCode,
    OtpCodeRepository,
} from '../../../../../src/modules/identity/domain/repositories/OtpCodeRepository';

class InMemoryIdentityRepository implements IdentityRepository {
    constructor(private readonly identity: Identity | null = null) { }

    findById(): Promise<Identity | null> {
        return Promise.resolve(this.identity);
    }

    findByContact(): Promise<Identity | null> {
        return Promise.resolve(this.identity);
    }

    save(identity: Identity): Promise<Identity> {
        return Promise.resolve(identity);
    }
}

class InMemoryOtpCodeRepository implements OtpCodeRepository {
    constructor(private readonly code: OtpCode | null) { }

    save(): Promise<OtpCode> {
        throw new Error('Not implemented');
    }

    findActive(): Promise<OtpCode | null> {
        return Promise.resolve(this.code);
    }

    consume(): Promise<void> {
        return Promise.resolve();
    }

    incrementAttempts(): Promise<void> {
        return Promise.resolve();
    }
}

describe('VerifyIdentity use case', () => {
    it('marks an identity verified when provided a valid OTP', async () => {
        const identity = Identity.register({
            id: 'identity-1',
            email: 'person@example.com',
        });

        const verifyUseCase = new VerifyIdentity({
            identityRepository: new InMemoryIdentityRepository(identity),
            otpCodeRepository: new InMemoryOtpCodeRepository({
                id: 'otp-1',
                identityId: 'identity-1',
                purpose: 'REGISTRATION',
                channel: 'EMAIL',
                codeHash: bcrypt.hashSync('123456', 10),
                attempts: 0,
                maxAttempts: 5,
                expiresAt: new Date(Date.now() + 60_000),
                consumedAt: null,
            }),
            passwordHasher: {
                hash: (value: string) => bcrypt.hashSync(value, 10),
                compare: (value: string, hash: string) => bcrypt.compareSync(value, hash),
            },
        });

        const result = await verifyUseCase.execute('identity-1', '123456', 'EMAIL');

        expect(result.identity.verificationStatus).toBe('VERIFIED');
        expect(result.verifiedChannel).toBe('EMAIL');
    });
});
