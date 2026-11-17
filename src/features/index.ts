import type { CreateOptions } from '../types.js';
import { drizzle } from './drizzle.js';
import { gatekeeper } from './gatekeeper.js';
import type { Feature } from './types.js';

/**
 * Every feature, in the order their additions go into a shared slot.
 */
export const FEATURES: readonly Feature[] = [gatekeeper, drizzle];

/**
 * The --db choices. A project has at most one database option.
 */
export const DATABASES = ['none', 'drizzle'] as const;
export type Database = (typeof DATABASES)[number];

export function isDatabase(value: unknown): value is Database {
  return DATABASES.includes(value as Database);
}

/**
 * The features chosen in the options, in FEATURES order.
 */
export function selectFeatures(options: CreateOptions): Feature[] {
  return FEATURES.filter((feature) => {
    switch (feature.id) {
      case 'gatekeeper':
        return options.includeGatekeeper;
      case 'drizzle':
        return options.database === 'drizzle';
      default:
        return false;
    }
  });
}
