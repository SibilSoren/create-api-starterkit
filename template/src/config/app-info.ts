import { readFileSync } from 'node:fs';

/**
 * Name and version from package.json, so they're defined in one place.
 * The path works from both src/ (dev, tests) and dist/ (production).
 */
const pkg = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'),
) as { name: string; version: string };

export const appInfo = { name: pkg.name, version: pkg.version };
