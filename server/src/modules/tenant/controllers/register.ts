// register controller for tenant module
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { DrizzleUnitOfWork } from '../../../repositories/UnitOfWork';
import { db } from '../../../db/connection';
import {
  sendErrorResponse,
  sendSuccessResponse,
  ApiError,
} from '../../../utils/errorHandler';
import { ErrorCode } from '../../../utils/APIContract';

/**
 * Register a new tenant controller
 * Returns tenant data and JWT access token
 */
export const registerTenant = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { name, email, password } = req.body;

    const authService = new AuthService();
    const uow = new DrizzleUnitOfWork(db);

    // Register tenant and generate token
    const { tenant, token } = await authService.registerTenant(uow, {
      name,
      email,
      password,
    });

    return sendSuccessResponse(res, 201, 'Tenant registered successfully', {
      tenant,
      auth: {
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: '1h',
      },
    });
  } catch (error) {
    console.error('Error in registerTenant controller:', error);

    if (error instanceof ApiError) {
      return sendErrorResponse(res, error);
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return sendErrorResponse(
        res,
        new ApiError(
          ErrorCode.TENANT_ALREADY_EXISTS,
          `Tenant with email '${req.body?.email}' already exists`,
          409,
          'email'
        )
      );
    }

    return sendErrorResponse(
      res,
      new ApiError(ErrorCode.INTERNAL_ERROR, 'Error registering tenant', 500)
    );
  }
};
