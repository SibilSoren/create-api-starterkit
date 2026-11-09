import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/app.js';

const app = createApp();

describe('GET /api/health', () => {
  it('should return 200 with healthy status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.message).toBe('Service is healthy');
  });

  it('should include uptime and memory usage', async () => {
    const response = await request(app).get('/api/health');

    expect(response.body.data).toHaveProperty('uptime');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.data).toHaveProperty('version');
    expect(response.body.data).toHaveProperty('memoryUsage');
    expect(response.body.data.memoryUsage).toHaveProperty('rss');
    expect(response.body.data.memoryUsage).toHaveProperty('heapUsed');
    expect(response.body.data.memoryUsage).toHaveProperty('heapTotal');
  });

  it('should have correct response structure', async () => {
    const response = await request(app).get('/api/health');

    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
  });
});

describe('GET /api/health in production', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('leaves out memory usage and the environment', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const { createApp: createProductionApp } =
      await import('../../../src/app.js');

    const response = await request(createProductionApp()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data).not.toHaveProperty('memoryUsage');
    expect(response.body.data).not.toHaveProperty('environment');
  });
});

describe('404 handling', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/nonexistent');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('not found');
  });
});
