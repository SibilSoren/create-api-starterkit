import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { composeProject } from '../src/compose/project.js';
import { listSlots } from '../src/compose/slots.js';
import { FEATURES } from '../src/features/index.js';
import { gatekeeper } from '../src/features/gatekeeper.js';
import type { Feature } from '../src/features/types.js';

/**
 * Checks every registered feature against the real template, so a template
 * change that breaks a feature fails here, not in a user's project.
 */

const templateDir = fileURLToPath(new URL('../template/', import.meta.url));
const featuresDir = fileURLToPath(new URL('../features/', import.meta.url));

let workDir: string;

beforeEach(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cas-features-'));
});

afterEach(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});

/** Every file under dir, as paths relative to it with "/" separators. */
function allFiles(dir: string, prefix = ''): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? allFiles(path.join(dir, entry.name), file) : [file];
  });
}

/** Compose the template with these features and read every file. */
function compose(features: Feature[]): Map<string, string> {
  const targetDir = path.join(workDir, features.map((f) => f.id).join('+') || 'none');
  composeProject({
    templateDir,
    featuresDir,
    targetDir,
    features,
    replacements: { '{{PROJECT_NAME}}': 'my-api' },
  });
  return new Map(
    allFiles(targetDir).map((file) => [
      file,
      fs.readFileSync(path.join(targetDir, file), 'utf-8'),
    ]),
  );
}

describe.each(FEATURES)('feature: $id', (feature) => {
  it('adds only to slots that appear exactly once in their file', () => {
    for (const { file, slot } of feature.slots ?? []) {
      const templatePath = path.join(templateDir, file === '.gitignore' ? '_gitignore' : file);
      const slots = fs.existsSync(templatePath)
        ? listSlots(fs.readFileSync(templatePath, 'utf-8'))
        : [];
      expect(slots.filter((name) => name === slot), `@slot ${slot} in ${file}`).toHaveLength(1);
    }
  });

  it("doesn't ship a file the template already has", () => {
    const templateFiles = new Set(allFiles(templateDir));
    for (const file of allFiles(path.join(featuresDir, feature.id))) {
      expect(templateFiles.has(file), file).toBe(false);
    }
  });

  it('changes nothing but package.json, the files it adds to and its own files', () => {
    const without = compose([]);
    const withFeature = compose([feature]);
    const allowed = new Set([
      'package.json',
      ...(feature.slots ?? []).map((addition) => addition.file),
      ...allFiles(path.join(featuresDir, feature.id)),
    ]);

    for (const [file, content] of withFeature) {
      if (without.get(file) !== content) {
        expect(allowed.has(file), `${file} changed`).toBe(true);
      }
    }
  });
});

describe('all features together', () => {
  it('compose without conflicts', () => {
    expect(() => compose([...FEATURES])).not.toThrow();
  });

  it('never share a file of their own', () => {
    const seen = new Map<string, string>();
    for (const feature of FEATURES) {
      for (const file of allFiles(path.join(featuresDir, feature.id))) {
        expect(seen.get(file), `${file} is in ${seen.get(file)} and ${feature.id}`).toBeUndefined();
        seen.set(file, feature.id);
      }
    }
  });
});

describe('gatekeeper', () => {
  it('imports gatekeeper by name and adds it after logging and the health check', () => {
    const appTs = compose([gatekeeper]).get('src/app.ts')!;

    expect(appTs).toContain("import { gatekeeper } from '@sibilsoren/gatekeeper';");
    expect(appTs).toContain("app.use(gatekeeper({ limit: 100, window: '1m' }));");
    expect(appTs.indexOf('app.use(requestLogger)')).toBeLessThan(
      appTs.indexOf('app.use(gatekeeper('),
    );
    // Load balancers must reach the health check even when a client is over the limit.
    expect(appTs.indexOf("app.use('/api/health'")).toBeLessThan(
      appTs.indexOf('app.use(gatekeeper('),
    );
    expect(appTs.indexOf('app.use(gatekeeper(')).toBeLessThan(
      appTs.indexOf("app.use('/api-docs'"),
    );
  });
});

describe('the published package', () => {
  it('includes the features folder, so feature files reach users', () => {
    const pkg = JSON.parse(
      fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
    ) as { files: string[] };

    expect(pkg.files).toEqual(expect.arrayContaining(['template', 'features']));
  });
});
