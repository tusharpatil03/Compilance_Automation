import { describe, expect, it } from '@jest/globals';
import { RegisterIdentity } from '../../../../../src/modules/identity/application/use-cases/RegisterIdentity';
import type { Identity } from '../../../../../src/modules/identity/domain/entities/Identity';
import type { IdentityRepository } from '../../../../../src/modules/identity/domain/repositories/IdentityRepository';
import type {
    OtpCode,
    OtpCodeRepository,
} from '../../../../../src/modules/identity/domain/repositories/OtpCodeRepository';

class InMemoryIdentityRepository implements IdentityRepository {
    identity: Identity | null = null;

    findById(): Promise<Identity | null> {
        return Promise.resolve(this.identity);
    }

    findByContact(): Promise<Identity | null> {
        return Promise.resolve(this.identity);
    }

    save(identity: Identity): Promise<Identity> {
        this.identity = identity;
        return Promise.resolve(identity);
    }
}

class InMemoryOtpCodeRepository implements OtpCodeRepository {
    code: OtpCode | null = null;

    save(code: OtpCode): Promise<OtpCode> {
        this.code = code;
        return Promise.resolve(code);
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

describe('RegisterIdentity use case', () => {
    it('creates an identity and registration OTP through ports', async () => {
        const identityRepository = new InMemoryIdentityRepository();
        const otpCodeRepository = new InMemoryOtpCodeRepository();
        const sentEmails: string[] = [];
        const recordedNames: Array<string | undefined> = [];

        const useCase = new RegisterIdentity({
            identityRepository,
            otpCodeRepository,
            registrationRecorder: {
                record: async (_identity, fullName) => {
                    recordedNames.push(fullName);
                },
            },
            emailSender: {
                send: async (recipient) => {
                    sentEmails.push(recipient);
                },
            },
            otpGenerator: { generate: () => '123456' },
            passwordHasher: {
                hash: (value) => `hashed:${value}`,
                compare: () => false,
            },
        });

        const result = await useCase.execute({
            email: 'person@example.com',
            fullName: 'Person Example',
        });

        expect(result.registrationStatus).toBe('PENDING_OTP');
        expect(result.otpChannel).toBe('EMAIL');
        expect(identityRepository.identity?.email).toBe('person@example.com');
        expect(otpCodeRepository.code?.codeHash).toBe('hashed:123456');
        expect(sentEmails).toEqual(['person@example.com']);
        expect(recordedNames).toEqual(['Person Example']);
    });
});
