import pinoHttp from 'pino-http';
import { logger } from '../utils/logger.js';

/**
 * HTTP request logging middleware powered by Pino.
 * Automatically logs request method, URL, status code, and response time.
 */
export const requestLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => {
      // Don't log health check requests to reduce noise
      return req.url === '/api/health' || req.url === '/api-docs';
    },
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
});
