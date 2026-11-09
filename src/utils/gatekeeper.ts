export const GATEKEEPER_PACKAGE = '@sibilsoren/gatekeeper';
export const GATEKEEPER_VERSION = '^2.0.0';

// Each anchor must match the template's src/app.ts exactly.
const IMPORT_ANCHOR =
  "import { healthRoutes } from './modules/health/health.routes.js';";
const MIDDLEWARE_ANCHOR =
  '  // ─── Request Logging ──────────────────────────────────────\n  app.use(requestLogger);\n';

const MIDDLEWARE = `
  // ─── Rate Limiting ────────────────────────────────────────
  // 100 requests per minute per client IP, counted in memory. Running more
  // than one server? Share the count with a RedisStore:
  // https://github.com/SibilSoren/gatekeeper#redis-store-distributed
  app.use(gatekeeper({ limit: 100, window: '1m' }));
`;

/**
 * Add Gatekeeper rate limiting to the template's app.ts, right after request
 * logging so rate-limited requests are still logged. Throws if the template
 * no longer matches, so a template change can't silently skip it.
 */
export function injectGatekeeper(appTs: string): string {
  for (const anchor of [IMPORT_ANCHOR, MIDDLEWARE_ANCHOR]) {
    if (!appTs.includes(anchor)) {
      throw new Error(`app.ts template changed; can't find: ${anchor}`);
    }
  }

  return appTs
    .replace(
      IMPORT_ANCHOR,
      `${IMPORT_ANCHOR}\nimport { gatekeeper } from '${GATEKEEPER_PACKAGE}';`,
    )
    .replace(MIDDLEWARE_ANCHOR, `${MIDDLEWARE_ANCHOR}${MIDDLEWARE}`);
}
