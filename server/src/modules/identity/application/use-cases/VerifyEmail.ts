import type { IdentityRepository } from '../../domain/repositories/IdentityRepository';
import type { OtpCodeRepository } from '../../domain/repositories/OtpCodeRepository';
import type { VerifyEmailCommand } from '../commands/VerifyEmailCommand';
import type { VerificationResult } from '../dtos/VerificationResult';
import { VerifyIdentity } from './VerifyIdentity';
import type { PasswordHasher } from '../ports/PasswordHasher';

export class VerifyEmail {
    private readonly verifyIdentity: VerifyIdentity;

    constructor(dependencies: {
        identityRepository: IdentityRepository;
        otpCodeRepository: OtpCodeRepository;
        passwordHasher: PasswordHasher;
    }) {
        this.verifyIdentity = new VerifyIdentity(dependencies);
    }

    execute(command: VerifyEmailCommand): Promise<VerificationResult> {
        return this.verifyIdentity.execute(command.identityId, command.code, 'EMAIL');
    }
}
