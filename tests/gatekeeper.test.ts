import fs from 'node:fs';
import { describe, it, expect } from 'vitest';
import { injectGatekeeper } from '../src/utils/gatekeeper.js';

const templateAppTs = fs.readFileSync(
  new URL('../template/src/app.ts', import.meta.url),
  'utf-8',
);

describe('injectGatekeeper', () => {
  it('imports gatekeeper by name and adds it after logging and the health check', () => {
    const appTs = injectGatekeeper(templateAppTs);

    expect(appTs).toContain(
      "import { gatekeeper } from '@sibilsoren/gatekeeper';",
    );
    expect(appTs).toContain("app.use(gatekeeper({ limit: 100, window: '1m' }));");
    expect(appTs.indexOf('app.use(requestLogger)')).toBeLessThan(
      appTs.indexOf('app.use(gatekeeper('),
    );
    // Load balancers must reach the health check even when a client is over the limit.
    expect(appTs.indexOf("app.use('/api/health'")).toBeLessThan(
      appTs.indexOf('app.use(gatekeeper('),
    );
    expect(appTs.indexOf('app.use(gatekeeper(')).toBeLessThan(
      appTs.indexOf("app.use('/api-docs'"),
    );
  });

  it('fails loudly if the template no longer matches', () => {
    expect(() => injectGatekeeper('export const app = 1;\n')).toThrow(
      /app.ts template changed/,
    );
  });
});
