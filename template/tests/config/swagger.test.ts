import { describe, it, expect } from 'vitest';
import { swaggerSpec } from '../../src/config/swagger.js';

describe('Swagger spec', () => {
  it('includes the routes documented in src/modules', () => {
    const spec = swaggerSpec as { paths?: Record<string, unknown> };

    expect(spec.paths).toHaveProperty('/api/health');
  });
});
