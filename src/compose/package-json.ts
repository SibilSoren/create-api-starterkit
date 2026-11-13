import type { Feature } from '../features/types.js';

type Entries = Record<string, string>;

export interface PackageJson {
  dependencies?: Entries;
  devDependencies?: Entries;
  scripts?: Entries;
  [field: string]: unknown;
}

const FIELDS = ['dependencies', 'devDependencies', 'scripts'] as const;

/**
 * Add the features' dependencies and scripts to package.json. Dependency
 * lists stay sorted, the way npm keeps them; scripts keep their order.
 * Throws if two features, or a feature and the template, disagree on an entry.
 */
export function addToPackageJson(
  pkg: PackageJson,
  features: readonly Feature[],
): PackageJson {
  const result: PackageJson = { ...pkg };

  for (const field of FIELDS) {
    const added: Entries = {};
    for (const feature of features) {
      for (const [name, value] of Object.entries(feature[field] ?? {})) {
        const current = added[name] ?? pkg[field]?.[name];
        if (current !== undefined && current !== value) {
          throw new Error(
            `The ${feature.id} feature sets ${field}.${name} to "${value}", but it's already "${current}".`,
          );
        }
        added[name] = value;
      }
    }
    if (Object.keys(added).length === 0) continue;

    const merged = { ...pkg[field], ...added };
    result[field] = field === 'scripts' ? merged : sortKeys(merged);
  }

  return result;
}

function sortKeys(entries: Entries): Entries {
  return Object.fromEntries(
    Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)),
  );
}
