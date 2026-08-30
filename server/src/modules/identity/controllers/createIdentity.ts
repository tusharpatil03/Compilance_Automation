import { Request, Response } from 'express';
import { db } from '../../../db/connection';
import { DrizzleUnitOfWork, UnitOfWork } from '../../../repositories/UnitOfWork';
import {
    ApiError,
    sendErrorResponse,
    sendSuccessResponse,
} from '../../../utils/errorHandler';
import { ErrorCode } from '../../../utils/APIContract';
import { RegisterIdentity } from '../application/use-cases/RegisterIdentity';
import { DrizzleIdentityRepository } from '../infrastructure/persistence/DrizzleIdentityRepository';
import { DrizzleOtpCodeRepository } from '../infrastructure/persistence/DrizzleOtpCodeRepository';
import { DrizzleIdentityRegistrationRecorder } from '../infrastructure/persistence/DrizzleIdentityRegistrationRecorder';
import { DefaultOtpGenerator } from '../infrastructure/services/DefaultOtpGenerator';
import { BcryptPasswordHasher } from '../infrastructure/services/BcryptPasswordHasher';
import { NodemailerEmailSender } from '../infrastructure/services/NodemailerEmailSender';
import { type RegisterIdentityInput } from '../zodschema';

export async function createIdentity(req: Request, res: Response) {
    try {
        const data: RegisterIdentityInput = req.body;

        if (!data.email && !data.phone_number) {
            throw new ApiError(
                ErrorCode.MISSING_REQUIRED_FIELD,
                'Either email or phone_number is required',
                400,
                'email'
            );
        }

        const uow: UnitOfWork = new DrizzleUnitOfWork(db);

        const result = await uow.execute(async (transaction) => {
            const useCase = new RegisterIdentity({
                identityRepository: transaction.getRepository(
                    DrizzleIdentityRepository
                ),
                otpCodeRepository: transaction.getRepository(
                    DrizzleOtpCodeRepository
                ),
                registrationRecorder: transaction.getRepository(
                    DrizzleIdentityRegistrationRecorder
                ),
                emailSender: new NodemailerEmailSender(),
                otpGenerator: new DefaultOtpGenerator(),
                passwordHasher: new BcryptPasswordHasher(),
            });

            return useCase.execute({
                email: data.email,
                phoneNumber: data.phone_number,
                fullName: data.full_name,
            });
        });

        return sendSuccessResponse(
            res,
            201,
            'Identity registered successfully',
            {
                identity: {
                    id: result.identity.id,
                    email: result.identity.email,
                    phone_number: result.identity.phoneNumber,
                    account_status: result.identity.accountStatus,
                    verification_status: result.identity.verificationStatus,
                    trust_score: result.identity.trustScore?.toString() ?? null,
                    risk_score: result.identity.riskScore?.toString() ?? null,
                    risk_rating: result.identity.riskRating,
                    created_at: result.identity.createdAt.toISOString(),
                    updated_at: result.identity.updatedAt.toISOString(),
                },
                registration_status: 'pending_otp',
                otp_channel: result.otpChannel,
                otp_expires_at: result.otpExpiresAt.toISOString(),
            }
        );
    } catch (error: any) {
        if (error instanceof ApiError) {
            return sendErrorResponse(res, error);
        }

        if (error?.message?.includes('already exists')) {
            return sendErrorResponse(
                res,
                new ApiError(ErrorCode.CONFLICT, error.message, 409)
            );
        }

        return sendErrorResponse(
            res,
            new ApiError(
                ErrorCode.INTERNAL_ERROR,
                error?.message ?? 'failed to register identity',
                500
            )
        );
    }
}