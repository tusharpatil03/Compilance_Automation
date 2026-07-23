import { Request, Response } from 'express';
import { db } from '../../../db/connection';
import { AuthService } from '../services/AuthService';
import { DrizzleUnitOfWork } from '../../../repositories/UnitOfWork';
import {
  sendErrorResponse,
  sendSuccessResponse,
  ApiError,
} from '../../../utils/errorHandler';
import { ErrorCode } from '../../../utils/APIContract';

export const loginTenant = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // instance of UnitOfWork to manage transaction and repositories
    const uow = new DrizzleUnitOfWork(db);

    const authService = new AuthService();

    // Authenticate tenant and generate token
    const { tenant, token } = await authService.loginTenant(uow, {
      email,
      password,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return sendSuccessResponse(res, 200, 'Login successful', {
      tenant,
      auth: {
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: '1h',
      },
    });
  } catch (error) {
    console.error('Error in loginTenant controller:', error);

    if (error instanceof ApiError) {
      return sendErrorResponse(res, error);
    }

    if (error instanceof Error) {
      if (error.message.includes('Invalid email or password')) {
        return sendErrorResponse(
          res,
          new ApiError(
            ErrorCode.INVALID_CREDENTIALS,
            'Invalid email or password',
            401
          )
        );
      }
      if (error.message.includes('not active')) {
        return sendErrorResponse(
          res,
          new ApiError(ErrorCode.FORBIDDEN, 'Tenant account is not active', 403)
        );
      }
    }

    return sendErrorResponse(
      res,
      new ApiError(ErrorCode.INTERNAL_ERROR, 'Error logging in tenant', 500)
    );
  }
};
