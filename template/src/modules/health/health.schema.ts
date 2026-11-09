import { z } from 'zod';

/**
 * Health check response schema.
 * `environment` and `memoryUsage` are only included outside production.
 */
export const healthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  uptime: z.number(),
  timestamp: z.iso.datetime(),
  version: z.string(),
  environment: z.string().optional(),
  memoryUsage: z
    .object({
      rss: z.string(),
      heapUsed: z.string(),
      heapTotal: z.string(),
    })
    .optional(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
