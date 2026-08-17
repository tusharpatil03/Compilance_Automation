import { Request, Response } from 'express';
import { db } from '../../../db/connection';
import { DrizzleUnitOfWork, UnitOfWork } from '../../../repositories/UnitOfWork';
import {
    ApiError,
    sendErrorResponse,
    sendSuccessResponse,
} from '../../../utils/errorHandler';
import { ErrorCode } from '../../../utils/APIContract';
import IndentityServices from '../services';
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

        const result = await IndentityServices.registerIdentity(
            uow,
            data
        );

        return sendSuccessResponse(
            res,
            201,
            'Identity registered successfully',
            result
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