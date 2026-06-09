import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Global error handling middleware.
 * Must be registered LAST in the middleware chain (4 args signature).
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log the error
  if (err instanceof ApiError && err.isOperational) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
  } else {
    logger.error({ err }, 'Unhandled error');
  }

  // If it's a known operational error, send the appropriate response
  if (err instanceof ApiError) {
    ApiResponse.error(res, err.message, err.statusCode);
    return;
  }

  // For unknown errors, send a generic 500 in production, or the full error in dev
  const message =
    env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  const statusCode = 500;
  ApiResponse.error(res, message, statusCode);
}
