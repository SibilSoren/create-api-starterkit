import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`🚀 Server running at http://${env.HOST}:${env.PORT}`);
  logger.info(`📚 API Docs available at http://localhost:${env.PORT}/api-docs`);
  logger.info(`🏥 Health check at http://localhost:${env.PORT}/api/health`);
  logger.info(`📦 Environment: ${env.NODE_ENV}`);

  if (env.NODE_ENV === 'production' && env.CORS_ORIGIN === '*') {
    logger.warn(
      'CORS_ORIGIN is "*", so any website can call this API. Set it to your frontend URL(s).',
    );
  }
});

// ─── Graceful Shutdown ────────────────────────────────────────

function gracefulShutdown(signal: string): void {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ err: reason }, 'Unhandled Rejection');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.fatal({ err: error }, 'Uncaught Exception');
  process.exit(1);
});
