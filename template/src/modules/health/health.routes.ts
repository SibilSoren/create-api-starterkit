import { Router } from 'express';
import { getHealth } from './health.controller.js';

const router = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     description: Returns the current health status of the API including uptime, memory usage, and environment info.
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                       example: healthy
 *                     uptime:
 *                       type: number
 *                       example: 123.45
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     environment:
 *                       type: string
 *                       example: development
 *                     memoryUsage:
 *                       type: object
 *                       properties:
 *                         rss:
 *                           type: string
 *                           example: "45.23 MB"
 *                         heapUsed:
 *                           type: string
 *                           example: "12.34 MB"
 *                         heapTotal:
 *                           type: string
 *                           example: "20.00 MB"
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', getHealth);

export { router as healthRoutes };
