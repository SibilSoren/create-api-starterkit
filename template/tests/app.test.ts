import { describe, it, expect, vi, afterEach } from 'vitest';

describe('createApp', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('trusts the proxies set in TRUST_PROXY', async () => {
    vi.stubEnv('TRUST_PROXY', '1');
    vi.resetModules();
    const { createApp } = await import('../src/app.js');

    expect(createApp().get('trust proxy')).toBe(1);
  });
});
