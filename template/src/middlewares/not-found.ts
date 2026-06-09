import type { Request, Response } from 'express';
import { ApiResponse } from '../utils/api-response.js';

/**
 * 404 Not Found handler.
 * Catches any request that didn't match a route.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  ApiResponse.error(
    res,
    `Route ${_req.method} ${_req.originalUrl} not found`,
    404,
  );
}
