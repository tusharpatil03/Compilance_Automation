import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError, sendErrorResponse } from './errorHandler';
import { ErrorCode } from './APIContract';

type ValidationSource = 'body' | 'query' | 'params';

export const validagteBody =
  <T>(schema: ZodSchema<T>, source: ValidationSource = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate =
        source === 'query'
          ? req.query
          : source === 'params'
            ? req.params
            : req.body;

      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const validationIssues = result.error.issues.map((issue) => ({
          field: issue.path.length > 0 ? issue.path.join('.') : source,
          message: issue.message,
          code: issue.code,
        }));
        const primaryIssue = validationIssues[0];

        console.error('Validation error:', validationIssues);
        return sendErrorResponse(
          res,
          new ApiError(
            ErrorCode.VALIDATION_ERROR,
            primaryIssue ? primaryIssue.message : 'Validation failed',
            400,
            primaryIssue?.field,
            validationIssues
          )
        );
      }

      // Overwrite the data with parsed data
      if (source === 'query') {
        Object.assign(req.query, result.data as any);
      } else if (source === 'params') {
        Object.assign(req.params, result.data as any);
      } else {
        req.body = result.data;
      }

      next();
    } catch (e) {
      console.log(e);
      sendErrorResponse(
        res,
        new ApiError(ErrorCode.VALIDATION_ERROR, 'invalid query', 400)
      );
    }
  };
