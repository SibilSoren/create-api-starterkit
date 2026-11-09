import type { IncomingMessage, ServerResponse } from 'node:http';
import { pinoHttp } from 'pino-http';
import { logger } from '../utils/logger.js';

// Requests that would only add noise: health checks and the Swagger UI's assets.
const QUIET_PATHS = ['/api/health', '/api-docs'];

/**
 * HTTP request logging middleware powered by Pino.
 * Logs one line per request: method, URL, status code and response time.
 */
export const requestLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req: IncomingMessage) => {
      const path = req.url?.split('?')[0] ?? '';
      return QUIET_PATHS.some((quiet) => path.startsWith(quiet));
    },
  },
  // Keep request logs short. Headers can hold tokens and cookies anyway.
  serializers: {
    req: (req: { id: unknown; method: string; url: string }) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
  },
  customSuccessMessage: (req: IncomingMessage, res: ServerResponse) =>
    `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req: IncomingMessage, res: ServerResponse) =>
    `${req.method} ${req.url} ${res.statusCode}`,
});
