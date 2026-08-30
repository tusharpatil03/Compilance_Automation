import { randomUUID } from 'node:crypto';
import { IdentityRepository } from '../../domain/repositories/IdentityRepository';
import {
    OtpChannel,
    OtpCodeRepository,
} from '../../domain/repositories/OtpCodeRepository';
import { Identity } from '../../domain/entities/Identity';
import { RegisterIdentityCommand } from '../commands/RegisterIdentityCommand';
import { RegisterIdentityResult } from '../dtos/RegisterIdentityResult';
import { EmailSender } from '../ports/EmailSender';
import { OtpGenerator } from '../ports/OtpGenerator';
import { PasswordHasher } from '../ports/PasswordHasher';
import { IdentityRegistrationRecorder } from '../ports/IdentityRegistrationRecorder';

export type RegisterIdentityDependencies = {
    identityRepository: IdentityRepository;
    otpCodeRepository: OtpCodeRepository;
    emailSender: EmailSender;
    otpGenerator: OtpGenerator;
    passwordHasher: PasswordHasher;
    registrationRecorder: IdentityRegistrationRecorder;
};

export class RegisterIdentity {
    constructor(private readonly dependencies: RegisterIdentityDependencies) { }

    async execute(
        command: RegisterIdentityCommand
    ): Promise<RegisterIdentityResult> {
        const existing = await this.dependencies.identityRepository.findByContact(
            command.email,
            command.phoneNumber
        );
        if (existing) {
            throw new Error('Identity already exists');
        }

        const identity: Identity = Identity.register({
            id: randomUUID(),
            email: command.email,
            phoneNumber: command.phoneNumber,
        });
        const savedIdentity = await this.dependencies.identityRepository.save(identity);
        await this.dependencies.registrationRecorder.record(
            savedIdentity,
            command.fullName
        );
        const otpChannel: OtpChannel = command.email ? 'EMAIL' : 'SMS';
        const otpValue = this.dependencies.otpGenerator.generate();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await this.dependencies.otpCodeRepository.save({
            id: randomUUID(),
            identityId: savedIdentity.id,
            purpose: 'REGISTRATION',
            channel: otpChannel,
            codeHash: this.dependencies.passwordHasher.hash(otpValue),
            attempts: 0,
            maxAttempts: 5,
            expiresAt: otpExpiresAt,
            consumedAt: null,
        });

        if (command.email) {
            await this.dependencies.emailSender.send(
                command.email,
                'Your OTP Code',
                `Your OTP code is: ${otpValue}. It will expire in 10 minutes.`
            );
        }

        return {
            identity: savedIdentity.snapshot,
            registrationStatus: 'PENDING_OTP',
            otpChannel,
            otpExpiresAt,
        };
    }
}
