import { randomInt } from 'crypto';
import { UnitOfWork } from '../../../repositories/UnitOfWork';
import { ApiError } from '../../../utils/errorHandler';
import { ErrorCode } from '../../../utils/APIContract';
import { hashPassword } from '../../../utils/security';
import {
    IdentityProfileHistoryRepository,
    IdentityProfileRepository,
    IdentityRepository,
    IdentityStatusHistoryRepository,
    OtpCodeRepository,
} from '../repository';
import { type Identity, type NewIdentity } from '../schema';
import { type RegisterIdentityInput } from '../zodschema';

export type RegisterIdentityResult = {
    identity: Identity;
    registration_status: 'pending_otp';
    otp_channel: 'EMAIL' | 'SMS';
    otp_expires_at: string;
};

export class IdentityServices {
    public async registerIdentity(
        uow: UnitOfWork,
        payload: RegisterIdentityInput
    ): Promise<RegisterIdentityResult> {
        if (!payload.email && !payload.phone_number) {
            throw new ApiError(
                ErrorCode.MISSING_REQUIRED_FIELD,
                'Either email or phone_number is required',
                400,
                'email'
            );
        }

        return uow.execute<RegisterIdentityResult>(async (uow) => {
            const identityRepository = uow.getRepository(IdentityRepository);
            const profileRepository = uow.getRepository(IdentityProfileRepository);
            const profileHistoryRepository = uow.getRepository(
                IdentityProfileHistoryRepository
            );
            const statusHistoryRepository = uow.getRepository(
                IdentityStatusHistoryRepository
            );
            const otpRepository = uow.getRepository(OtpCodeRepository);

            const existing = await identityRepository.findByEmailOrPhone(
                payload.email,
                payload.phone_number
            );
            if (existing) {
                throw new ApiError(
                    ErrorCode.CONFLICT,
                    'Identity already exists',
                    409,
                    payload.email ? 'email' : 'phone_number'
                );
            }

            const now = new Date().toISOString();
            const identityPayload: NewIdentity = {
                email: payload.email ?? null,
                phone_number: payload.phone_number ?? null,
                account_status: 'REGISTERED',
                verification_status: 'UNVERIFIED',
                trust_score: null,
                risk_score: null,
                risk_rating: null,
                created_at: now,
                updated_at: now,
            };

            const identity = await identityRepository.createIdentity(identityPayload);

            const profilePayload = {
                identity_id: identity.id,
                full_name: payload.full_name ?? null,
                date_of_birth: null,
                address_line1: null,
                address_line2: null,
                city: null,
                country: null,
                postal_code: null,
                updated_at: now,
            };
            await profileRepository.upsertProfile(identity.id, profilePayload);

            if (payload.full_name) {
                await profileHistoryRepository.createHistory({
                    identity_id: identity.id,
                    field_name: 'full_name',
                    old_value: null,
                    new_value: payload.full_name,
                    changed_by: identity.id,
                    changed_at: now,
                });
            }

            await statusHistoryRepository.createHistory({
                identity_id: identity.id,
                status_type: 'account_status',
                from_status: null,
                to_status: 'REGISTERED',
                reason: 'Identity created',
                changed_by: null,
                created_at: now,
            });

            await statusHistoryRepository.createHistory({
                identity_id: identity.id,
                status_type: 'verification_status',
                from_status: null,
                to_status: 'UNVERIFIED',
                reason: 'Identity created',
                changed_by: null,
                created_at: now,
            });

            const otpValue = randomInt(100000, 999999).toString();
            const otpHash = hashPassword(otpValue).hashedPassword;
            const otpChannel: 'EMAIL' | 'SMS' = payload.email ? 'EMAIL' : 'SMS';
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

            await otpRepository.createOtpCode({
                identity_id: identity.id,
                purpose: 'REGISTRATION',
                channel: otpChannel,
                code_hash: otpHash,
                attempts: 0,
                max_attempts: 5,
                expires_at: otpExpiresAt,
                consumed_at: null,
                created_at: now,
            });

            return {
                identity,
                registration_status: 'pending_otp',
                otp_channel: otpChannel,
                otp_expires_at: otpExpiresAt,
            };
        });
    }
}
