import type { CreateOptions } from '../types.js';
import { gatekeeper } from './gatekeeper.js';
import type { Feature } from './types.js';

/**
 * Every feature, in the order their additions go into a shared slot.
 */
export const FEATURES: readonly Feature[] = [gatekeeper];

/**
 * The features chosen in the options, in FEATURES order.
 */
export function selectFeatures(options: CreateOptions): Feature[] {
  return FEATURES.filter((feature) => {
    switch (feature.id) {
      case 'gatekeeper':
        return options.includeGatekeeper;
      default:
        return false;
    }
  });
}
