import { Request, Response } from 'express';
import { db } from '../../../db/connection';
import { DrizzleUnitOfWork, UnitOfWork } from '../../../repositories/UnitOfWork';
import {
    ApiError,
    sendErrorResponse,
    sendSuccessResponse,
} from '../../../utils/errorHandler';
import { ErrorCode } from '../../../utils/APIContract';
import { VerifyPhone } from '../application/use-cases/VerifyPhone';
import { BcryptPasswordHasher } from '../infrastructure/services/BcryptPasswordHasher';
import { DrizzleIdentityRepository } from '../infrastructure/persistence/DrizzleIdentityRepository';
import { DrizzleOtpCodeRepository } from '../infrastructure/persistence/DrizzleOtpCodeRepository';
import { type VerifyPhoneInput } from '../zodschema';

export async function verifyPhoneController(req: Request, res: Response) {
    try {
        const data: VerifyPhoneInput = req.body;
        const uow: UnitOfWork = new DrizzleUnitOfWork(db);

        const result = await uow.execute(async (transaction) => {
            const useCase = new VerifyPhone({
                identityRepository: transaction.getRepository(DrizzleIdentityRepository),
                otpCodeRepository: transaction.getRepository(DrizzleOtpCodeRepository),
                passwordHasher: new BcryptPasswordHasher(),
            });

            return useCase.execute({
                identityId: data.identity_id,
                code: data.code,
            });
        });

        return sendSuccessResponse(res, 200, 'Identity phone verified successfully', {
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
            verified_channel: result.verifiedChannel,
        });
    } catch (error: any) {
        if (error instanceof ApiError) {
            return sendErrorResponse(res, error);
        }

        return sendErrorResponse(
            res,
            new ApiError(
                ErrorCode.INTERNAL_ERROR,
                error?.message ?? 'failed to verify phone',
                500
            )
        );
    }
}
