import type { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response.js';
import { env } from '../../config/env.js';
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
 */
export function getHealth(_req: Request, res: Response): void {
  const memoryUsage = process.memoryUsage();

  const health: HealthResponse = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.NODE_ENV,
    memoryUsage: {
      rss: formatBytes(memoryUsage.rss),
      heapUsed: formatBytes(memoryUsage.heapUsed),
      heapTotal: formatBytes(memoryUsage.heapTotal),
    },
  };

  ApiResponse.success(res, health, 'Service is healthy');
}
