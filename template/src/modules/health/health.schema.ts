import { z } from 'zod';

/**
 * Health check response schema.
 */
export const healthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  uptime: z.number(),
  timestamp: z.string().datetime(),
  version: z.string(),
  environment: z.string(),
  memoryUsage: z.object({
    rss: z.string(),
    heapUsed: z.string(),
    heapTotal: z.string(),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
