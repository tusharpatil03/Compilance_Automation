import { Request, Response, NextFunction } from 'express';
import { TenantAPIKeyRepository } from '../../tenant/respository';
import { db } from '../../../db/connection';
import { compareApiKeyHash } from '../../../utils/security';
import { sendErrorResponse, ApiError } from '../../../utils/errorHandler';
import { ErrorCode } from '../../../utils/APIContract';

export async function apiAuth(req: Request, res: Response, next: NextFunction) {
  const key_id = req.body.api_key_id;
  const api_key = req.body.api_key;
  const tenant_id = req.body.tenant_id;

  if (!tenant_id) {
    return sendErrorResponse(
      res,
      new ApiError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required field: tenant_id',
        400,
        'tenant_id'
      )
    );
  }

  if (!key_id) {
    return sendErrorResponse(
      res,
      new ApiError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required field: api_key_id',
        400,
        'api_key_id'
      )
    );
  }

  if (!api_key) {
    return sendErrorResponse(
      res,
      new ApiError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Missing required field: api_key',
        400,
        'api_key'
      )
    );
  }

  const tenantId = Number(tenant_id);
  if (Number.isNaN(tenantId)) {
    return sendErrorResponse(
      res,
      new ApiError(
        ErrorCode.INVALID_ID,
        `Invalid tenant_id: ${tenant_id}. Must be a valid number`,
        400,
        'tenant_id'
      )
    );
  }

  const tenantApiKeyRepo = new TenantAPIKeyRepository(db);
  //fetch instance from database
  const tenant_api_key = await tenantApiKeyRepo.getApiKeyByKey_prefix(
    key_id,
    tenantId
  );

  if (!tenant_api_key) {
    return sendErrorResponse(
      res,
      new ApiError(ErrorCode.INVALID_API_KEY, 'Invalid API key', 401)
    );
  }

  //check key is active or not
  if (tenant_api_key.status === 'revoked') {
    return sendErrorResponse(
      res,
      new ApiError(ErrorCode.INVALID_API_KEY, 'Invalid API key', 401)
    );
  }

  if (tenant_api_key.status === 'inactive') {
    return sendErrorResponse(
      res,
      new ApiError(ErrorCode.INVALID_API_KEY, 'Invalid API key', 401)
    );
  }

  const isValidKey = await compareApiKeyHash(
    api_key,
    tenant_api_key.api_key_hash
  );
  if (!isValidKey) {
    return sendErrorResponse(
      res,
      new ApiError(ErrorCode.INVALID_API_KEY, 'Invalid API key', 401)
    );
  }

  //inject tenant info into request for downstream handlers
  (req as any).tenant = { id: tenant_api_key.tenant_id };

  return next();
}
