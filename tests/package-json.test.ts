import { describe, it, expect } from 'vitest';
import { addToPackageJson } from '../src/compose/package-json.js';
import type { Feature } from '../src/features/types.js';

const template = {
  name: 'my-api',
  scripts: { dev: 'tsx watch src/server.ts', build: 'tsc' },
  dependencies: { express: '^5.0.0', zod: '^4.0.0' },
  devDependencies: { vitest: '^5.0.0', eslint: '^10.0.0' },
};

describe('addToPackageJson', () => {
  it('adds dependencies in sorted order and scripts at the end', () => {
    const feature: Feature = {
      id: 'db',
      dependencies: { pg: '^8.0.0' },
      scripts: { 'db:seed': 'tsx src/db/seed.ts' },
    };

    const pkg = addToPackageJson(template, [feature]);

    expect(Object.keys(pkg.dependencies!)).toEqual(['express', 'pg', 'zod']);
    expect(Object.keys(pkg.scripts!)).toEqual(['dev', 'build', 'db:seed']);
  });

  it('leaves fields no feature touches exactly as they were', () => {
    const pkg = addToPackageJson(template, [
      { id: 'x', dependencies: { pg: '^8.0.0' } },
    ]);

    // Unsorted in the template, and still unsorted.
    expect(pkg.devDependencies).toBe(template.devDependencies);
    expect(pkg.name).toBe('my-api');
  });

  it('accepts the same entry from two features', () => {
    const a: Feature = { id: 'a', dependencies: { pg: '^8.0.0' } };
    const b: Feature = { id: 'b', dependencies: { pg: '^8.0.0' } };

    expect(addToPackageJson(template, [a, b]).dependencies?.pg).toBe('^8.0.0');
  });

  it('refuses two features that disagree on an entry', () => {
    const a: Feature = { id: 'a', dependencies: { pg: '^8.0.0' } };
    const b: Feature = { id: 'b', dependencies: { pg: '^7.0.0' } };

    expect(() => addToPackageJson(template, [a, b])).toThrow(
      'The b feature sets dependencies.pg to "^7.0.0", but it\'s already "^8.0.0".',
    );
  });

  it('refuses a feature that changes a template entry', () => {
    const feature: Feature = { id: 'x', scripts: { build: 'something else' } };

    expect(() => addToPackageJson(template, [feature])).toThrow(
      'The x feature sets scripts.build',
    );
  });
});
