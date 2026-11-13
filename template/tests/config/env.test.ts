import { describe, it, expect } from 'vitest';
import { envSchema } from '../../src/config/env.js';

describe('TRUST_PROXY', () => {
  const parse = (value?: string) => envSchema.safeParse({ TRUST_PROXY: value });

  it('defaults to 0, no proxy', () => {
    expect(parse().data?.TRUST_PROXY).toBe(0);
    expect(parse('false').data?.TRUST_PROXY).toBe(0);
  });

  it('reads a hop count as a number', () => {
    expect(parse('1').data?.TRUST_PROXY).toBe(1);
  });

  it('passes proxy addresses and subnets on to Express', () => {
    expect(parse('loopback,10.0.0.0/8').data?.TRUST_PROXY).toBe(
      'loopback,10.0.0.0/8',
    );
  });

  it('refuses true, which would let clients choose their own IP', () => {
    expect(parse('true').success).toBe(false);
    expect(parse('TRUE').success).toBe(false);
  });
});
