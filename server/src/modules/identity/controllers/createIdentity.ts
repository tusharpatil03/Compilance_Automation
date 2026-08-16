import { Request, Response } from 'express';
import { db } from '../../../db/connection';
import { DrizzleUnitOfWork, UnitOfWork } from '../../../repositories/UnitOfWork';
import {
    ApiError,
    sendErrorResponse,
    sendSuccessResponse,
} from '../../../utils/errorHandler';
import { ErrorCode } from '../../../utils/APIContract';
import { IdentityServices } from '../services/IdentityServices';
import { type RegisterIdentityInput } from '../zodschema';

export function createIdentity(req: Request, res: Response) {
    try {
        const uow: UnitOfWork = new DrizzleUnitOfWork(db);
        const identityServices = new IdentityServices();

        const data: RegisterIdentityInput = req.body;
        const result = identityServices.registerIdentity(
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