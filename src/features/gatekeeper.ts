import type { Feature } from './types.js';

export const GATEKEEPER_PACKAGE = '@sibilsoren/gatekeeper';
export const GATEKEEPER_VERSION = '^2.0.0';

/**
 * Rate limiting with Gatekeeper. It goes right after the health check, so
 * rate-limited requests are still logged and health checks are never limited.
 */
export const gatekeeper: Feature = {
  id: 'gatekeeper',
  dependencies: { [GATEKEEPER_PACKAGE]: GATEKEEPER_VERSION },
  slots: [
    {
      file: 'src/app.ts',
      slot: 'imports',
      text: `import { gatekeeper } from '${GATEKEEPER_PACKAGE}';\n`,
    },
    {
      file: 'src/app.ts',
      slot: 'middleware',
      text: `
  // ─── Rate Limiting ────────────────────────────────────────
  // 100 requests per minute per client IP, counted in memory. Behind a load
  // balancer, set TRUST_PROXY, or every client shares one limit. Running more
  // than one server? Share the count with a RedisStore:
  // https://github.com/SibilSoren/gatekeeper#redis-store-distributed
  app.use(gatekeeper({ limit: 100, window: '1m' }));
`,
    },
  ],
};
