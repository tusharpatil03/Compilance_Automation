import type { IdentityProps } from '../../domain/entities/Identity';

export type RegisterIdentityResult = {
    identity: IdentityProps;
    registrationStatus: 'PENDING_OTP';
    otpChannel: 'EMAIL' | 'SMS';
    otpExpiresAt: Date;
};
