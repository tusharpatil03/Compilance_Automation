export type OtpChannel = 'EMAIL' | 'SMS';
export type OtpPurpose = 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';

export type OtpCode = {
    id: string;
    identityId: string;
    purpose: OtpPurpose;
    channel: OtpChannel;
    codeHash: string;
    attempts: number;
    maxAttempts: number;
    expiresAt: Date;
    consumedAt: Date | null;
};

export interface OtpCodeRepository {
    save(code: OtpCode): Promise<OtpCode>;
    findActive(identityId: string, purpose: OtpPurpose, channel: OtpChannel): Promise<OtpCode | null>;
    consume(id: string, consumedAt: Date): Promise<void>;
    incrementAttempts(id: string): Promise<void>;
}
