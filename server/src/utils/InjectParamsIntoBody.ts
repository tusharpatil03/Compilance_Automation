import { NextFunction, Request, Response } from 'express';
import { ApiError, sendErrorResponse } from './errorHandler';
import { ErrorCode } from './APIContract';

export function injectParamsIntoBody(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Merge req.params into req.body
    req.body = { ...req.body, ...req.params };
    req.body = { ...req.body, ...req.query }; // Merge req.query into req.body
    next();
  } catch (error) {
    console.error('Error in injectParamsIntoBody middleware:', error);
    sendErrorResponse(
      res,
      new ApiError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to inject parameters into request body',
        500
      )
    );
  }
}
