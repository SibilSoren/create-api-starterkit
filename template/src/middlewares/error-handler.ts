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
  // If it's a known operational error, send the appropriate response
  if (err instanceof ApiError) {
    if (err.isOperational) {
      logger.warn({ err, statusCode: err.statusCode }, err.message);
    } else {
      logger.error({ err }, 'Unhandled error');
    }
    ApiResponse.error(res, err.message, err.statusCode);
    return;
  }

  // Errors from Express itself, such as malformed JSON or a body that's too
  // large, carry a 4xx status. They're the client's mistake, not a 500.
  const clientStatus = getClientErrorStatus(err);
  if (clientStatus) {
    // No stack trace: there's nothing to debug on the server side.
    logger.warn({ statusCode: clientStatus }, err.message);
    const message =
      'type' in err && err.type === 'entity.parse.failed'
        ? 'Malformed JSON in request body'
        : err.message;
    ApiResponse.error(res, message, clientStatus);
    return;
  }

  logger.error({ err }, 'Unhandled error');

  // For unknown errors, send a generic 500 in production, or the full error in dev
  const message =
    env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  ApiResponse.error(res, message, 500);
}

function getClientErrorStatus(err: Error): number | undefined {
  const status =
    'status' in err ? err.status : 'statusCode' in err ? err.statusCode : null;
  return typeof status === 'number' && status >= 400 && status < 500
    ? status
    : undefined;
}
