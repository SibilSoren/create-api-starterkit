import { describe, it, expect } from 'vitest';
import { envSchema } from '../../src/config/env.js';

// Each variable is checked on its own, so the tests don't depend on what
// other variables the app requires.

describe('TRUST_PROXY', () => {
  const parse = (value?: string) =>
    envSchema.shape.TRUST_PROXY.safeParse(value);

  it('defaults to 0, no proxy', () => {
    expect(parse().data).toBe(0);
    expect(parse('false').data).toBe(0);
  });

  it('reads a hop count as a number', () => {
    expect(parse('1').data).toBe(1);
  });

  it('passes proxy addresses and subnets on to Express', () => {
    expect(parse('loopback,10.0.0.0/8').data).toBe('loopback,10.0.0.0/8');
  });

  it('refuses true, which would let clients choose their own IP', () => {
    expect(parse('true').success).toBe(false);
    expect(parse('TRUE').success).toBe(false);
  });
});

describe('PORT', () => {
  const parse = (value?: string) => envSchema.shape.PORT.safeParse(value);

  it('defaults to 3000 and reads a port number', () => {
    expect(parse().data).toBe(3000);
    expect(parse('8080').data).toBe(8080);
  });

  it('refuses values that are not a port', () => {
    for (const value of ['0', '3000.5', '65536', '-1', 'abc']) {
      expect(parse(value).success, value).toBe(false);
    }
  });
});
