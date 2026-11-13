import fs from 'node:fs';
import path from 'node:path';
import type { Feature } from '../features/types.js';
import { copyTemplateDir } from '../utils/fs.js';
import { addToPackageJson } from './package-json.js';
import { fillSlots } from './slots.js';

export interface ComposeOptions {
  /** The base template: the whole project without any feature. */
  templateDir: string;
  /** Holds one folder of extra files per feature, named after its id. */
  featuresDir: string;
  targetDir: string;
  features: readonly Feature[];
  /** Placeholders to replace in every text file, e.g. {{PROJECT_NAME}}. */
  replacements: Record<string, string>;
}

/**
 * Write the template and the chosen features into targetDir:
 *
 * 1. Copy the template, filling each slot with the features' additions.
 * 2. Copy each feature's own files, which may not replace an existing file.
 * 3. Add the features' dependencies and scripts to package.json.
 *
 * Throws if a feature adds to a slot that doesn't exist, so a template change
 * can't silently drop part of a feature.
 */
export function composeProject(options: ComposeOptions): void {
  const { templateDir, featuresDir, targetDir, features, replacements } = options;
  const additions = groupSlotAdditions(features);
  const filled = new Set<string>();

  const transform = (file: string, content: string): string => {
    const result = fillSlots(content, additions.get(file) ?? new Map(), file);
    for (const slot of result.filled) filled.add(`${file} ${slot}`);

    let text = result.content;
    for (const [placeholder, value] of Object.entries(replacements)) {
      text = text.replaceAll(placeholder, value);
    }
    return text;
  };

  copyTemplateDir(templateDir, targetDir, transform);
  for (const feature of features) {
    const filesDir = path.join(featuresDir, feature.id);
    if (fs.existsSync(filesDir)) {
      copyTemplateDir(filesDir, targetDir, transform, { overwrite: false });
    }
  }

  for (const feature of features) {
    for (const { file, slot } of feature.slots ?? []) {
      if (!filled.has(`${file} ${slot}`)) {
        throw new Error(
          `The ${feature.id} feature adds to "@slot ${slot}" in ${file}, but there's no such slot. Was the template changed?`,
        );
      }
    }
  }

  const packageJsonPath = path.join(targetDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(addToPackageJson(pkg, features), null, 2) + '\n',
  );
}

/**
 * The features' slot additions, by file and then by slot, in feature order.
 */
function groupSlotAdditions(
  features: readonly Feature[],
): Map<string, Map<string, string[]>> {
  const byFile = new Map<string, Map<string, string[]>>();
  for (const feature of features) {
    for (const { file, slot, text } of feature.slots ?? []) {
      const bySlot = byFile.get(file) ?? new Map<string, string[]>();
      bySlot.set(slot, [...(bySlot.get(slot) ?? []), text]);
      byFile.set(file, bySlot);
    }
  }
  return byFile;
}
