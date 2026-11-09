import type { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response.js';
import { env } from '../../config/env.js';
import { appInfo } from '../../config/app-info.js';
import type { HealthResponse } from './health.schema.js';

/**
 * Format bytes to a human-readable string.
 */
function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * GET /api/health
 * Returns the current health status of the API.
 * Memory and environment details are left out in production, where this
 * endpoint is usually public.
 */
export function getHealth(_req: Request, res: Response): void {
  const health: HealthResponse = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: appInfo.version,
  };

  if (env.NODE_ENV !== 'production') {
    const memoryUsage = process.memoryUsage();
    health.environment = env.NODE_ENV;
    health.memoryUsage = {
      rss: formatBytes(memoryUsage.rss),
      heapUsed: formatBytes(memoryUsage.heapUsed),
      heapTotal: formatBytes(memoryUsage.heapTotal),
    };
  }

  ApiResponse.success(res, health, 'Service is healthy');
}
