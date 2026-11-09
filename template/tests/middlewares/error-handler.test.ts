import { describe, it, expect } from 'vitest';
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
