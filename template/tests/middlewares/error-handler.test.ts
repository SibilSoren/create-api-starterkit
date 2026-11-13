import { describe, it, expect, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('error handler', () => {
  it('returns 400 for malformed JSON', async () => {
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"name": ');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Malformed JSON in request body');
  });

  it('returns 413 for a body over the size limit', async () => {
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ data: 'x'.repeat(1024 * 1024 + 1) }));

    expect(response.status).toBe(413);
    expect(response.body.success).toBe(false);
  });
});

describe('error handler and ApiError messages', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  // A fresh app with routes that throw, loaded for the given NODE_ENV.
  async function appFor(nodeEnv: 'production' | 'test') {
    vi.stubEnv('NODE_ENV', nodeEnv);
    vi.resetModules();
    const { errorHandler } =
      await import('../../src/middlewares/error-handler.js');
    const { ApiError } = await import('../../src/utils/api-error.js');

    const errorApp = express();
    errorApp.get('/operational', () => {
      throw ApiError.notFound('User 42 not found');
    });
    errorApp.get('/bug', () => {
      throw ApiError.internal('Query failed: postgres://admin:hunter2@db/app');
    });
    errorApp.use(errorHandler);
    return errorApp;
  }

  it('sends the message of an operational error in production', async () => {
    const response = await request(await appFor('production')).get(
      '/operational',
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User 42 not found');
  });

  it('hides the message of a non-operational error in production', async () => {
    const response = await request(await appFor('production')).get('/bug');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal Server Error');
    expect(JSON.stringify(response.body)).not.toContain('hunter2');
  });

  it('shows the message of a non-operational error outside production', async () => {
    const response = await request(await appFor('test')).get('/bug');

    expect(response.status).toBe(500);
    expect(response.body.message).toContain('Query failed');
  });
});
