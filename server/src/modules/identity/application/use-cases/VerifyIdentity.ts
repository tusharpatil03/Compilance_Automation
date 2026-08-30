import type { IdentityRepository } from '../../domain/repositories/IdentityRepository';
import type {
    OtpChannel,
    OtpCodeRepository,
} from '../../domain/repositories/OtpCodeRepository';
import type { Identity } from '../../domain/entities/Identity';
import type { PasswordHasher } from '../ports/PasswordHasher';
import type { VerificationResult } from '../dtos/VerificationResult';

export type VerifyIdentityDependencies = {
    identityRepository: IdentityRepository;
    otpCodeRepository: OtpCodeRepository;
    passwordHasher: PasswordHasher;
};

export class VerifyIdentity {
    constructor(private readonly dependencies: VerifyIdentityDependencies) { }

    async execute(
        identityId: string,
        code: string,
        channel: OtpChannel
    ): Promise<VerificationResult> {
        const identity = await this.dependencies.identityRepository.findById(identityId);
        if (!identity) {
            throw new Error('Identity not found');
        }

        const otp = await this.dependencies.otpCodeRepository.findActive(
            identityId,
            'REGISTRATION',
            channel
        );
        if (!otp) {
            throw new Error('Verification code is expired or unavailable');
        }

        if (otp.attempts >= otp.maxAttempts) {
            throw new Error('Verification code attempt limit exceeded');
        }

        const matches = this.dependencies.passwordHasher.compare(code, otp.codeHash);
        if (!matches) {
            await this.dependencies.otpCodeRepository.incrementAttempts(otp.id);
            throw new Error('Invalid verification code');
        }

        identity.verify();
        await this.dependencies.otpCodeRepository.consume(otp.id, new Date());
        const savedIdentity = await this.dependencies.identityRepository.save(identity);

        return {
            identity: savedIdentity.snapshot,
            verifiedChannel: channel,
        };
    }
}
