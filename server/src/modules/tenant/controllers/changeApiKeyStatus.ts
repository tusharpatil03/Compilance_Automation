import { Request, Response } from 'express';
import { TenantApiServices } from '../services/TenantApiServices';
import {
  sendErrorResponse,
  sendSuccessResponse,
  ApiError,
} from '../../../utils/errorHandler';
import type { AuthenticatedRequest } from '../middlewares/auth';
import { ErrorCode } from '../../../utils/APIContract';

export async function changeApiKeyStatus(req: Request, res: Response) {
  try {
    const { kid, status } = req.body as {
      kid?: string;
      status?: string;
    };

    if (!kid) {
      return sendErrorResponse(
        res,
        new ApiError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Missing required field: kid',
          400
        )
      );
    }

    if (!status) {
      return sendErrorResponse(
        res,
        new ApiError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Missing required field: status',
          400
        )
      );
    }

    const authReq = req as AuthenticatedRequest;
    const tenantId = authReq.tenant?.id;

    if (!tenantId) {
      return sendErrorResponse(
        res,
        new ApiError(ErrorCode.AUTH_REQUIRED, 'Authentication required', 401)
      );
    }

    const tenantApiServices = new TenantApiServices();

    if (status === 'inactive') {
      await tenantApiServices.deactivateApiKey(kid, tenantId);
      return sendSuccessResponse(res, 200, 'API key has been deactivated');
    } else if (status === 'revoked') {
      await tenantApiServices.revokeApiKey(kid, tenantId);
      return sendSuccessResponse(res, 200, 'API key has been revoked');
    } else {
      return sendErrorResponse(
        res,
        new ApiError(
          ErrorCode.VALIDATION_ERROR,
          "Invalid status. Valid statuses: 'inactive', 'revoked'",
          400
        )
      );
    }
  } catch (error: any) {
    if (error instanceof ApiError) {
      return sendErrorResponse(res, error);
    }

    if (error?.message?.includes('Forbidden')) {
      return sendErrorResponse(
        res,
        new ApiError(
          ErrorCode.KEY_DOES_NOT_BELONG,
          'This key does not belong to your tenant',
          403
        )
      );
    }

    if (error?.message?.includes('not exist')) {
      return sendErrorResponse(
        res,
        new ApiError(
          ErrorCode.API_KEY_NOT_FOUND,
          `API key '${req.body?.kid}' not found`,
          404
        )
      );
    }

    return sendErrorResponse(
      res,
      new ApiError(
        ErrorCode.INTERNAL_ERROR,
        error?.message ?? 'Failed to change API key status',
        500
      )
    );
  }
}
