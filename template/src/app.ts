import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { requestLogger } from './middlewares/request-logger.js';
import { notFoundHandler } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';
import { healthRoutes } from './modules/health/health.routes.js';
// @slot imports

/**
 * Creates and configures the Express application.
 * Separated from server.ts to allow testing without starting the HTTP server.
 */
export function createApp(): express.Application {
  const app = express();

  // ─── Proxies ──────────────────────────────────────────────
  // Behind a load balancer, TRUST_PROXY makes req.ip the client's address
  // instead of the load balancer's.
  app.set('trust proxy', env.TRUST_PROXY);

  // ─── Security ─────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ─── Body Parsing ─────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Request Logging ──────────────────────────────────────
  app.use(requestLogger);

  // ─── Health Check ─────────────────────────────────────────
  // Kept above any rate limiting, so load balancers and orchestrators can
  // always reach it.
  app.use('/api/health', healthRoutes);
  // @slot middleware

  // ─── API Documentation ────────────────────────────────────
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // ─── Add your routes here ─────────────────────────────────
  // app.use('/api/users', userRoutes);
  // app.use('/api/posts', postRoutes);

  // ─── Error Handling ───────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
