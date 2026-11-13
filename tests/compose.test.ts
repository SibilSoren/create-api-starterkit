import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { composeProject } from '../src/compose/project.js';
import type { Feature } from '../src/features/types.js';

/**
 * composeProject on a small throwaway template and fake features.
 */

let workDir: string;

beforeEach(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cas-compose-'));
});

afterEach(() => {
  fs.rmSync(workDir, { recursive: true, force: true });
});

function writeFiles(dir: string, files: Record<string, string>): void {
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), content);
  }
}

const templateFiles = {
  'package.json': JSON.stringify({ name: '{{PROJECT_NAME}}', dependencies: {} }),
  'src/app.ts': "import a from 'a';\n// @slot imports\n\nrun();\n  // @slot middleware\n",
  'docker-compose.yml': 'services:\n  api:\n    build: .\n  # @slot services\n',
  _gitignore: 'node_modules/\n',
};

function compose(features: Feature[], featureFiles: Record<string, string> = {}) {
  const templateDir = path.join(workDir, 'template');
  const featuresDir = path.join(workDir, 'features');
  const targetDir = path.join(workDir, 'out');
  writeFiles(templateDir, templateFiles);
  writeFiles(featuresDir, featureFiles);

  composeProject({
    templateDir,
    featuresDir,
    targetDir,
    features,
    replacements: { '{{PROJECT_NAME}}': 'my-api' },
  });

  return (file: string) => fs.readFileSync(path.join(targetDir, file), 'utf-8');
}

describe('composeProject', () => {
  it('copies the template with every slot removed when there are no features', () => {
    const read = compose([]);

    expect(read('src/app.ts')).toBe("import a from 'a';\n\nrun();\n");
    expect(read('docker-compose.yml')).toBe('services:\n  api:\n    build: .\n');
    expect(read('.gitignore')).toBe('node_modules/\n');
    expect(JSON.parse(read('package.json')).name).toBe('my-api');
  });

  it("fills slots with each feature's additions, in feature order", () => {
    const one: Feature = {
      id: 'one',
      slots: [
        { file: 'src/app.ts', slot: 'imports', text: "import one from 'one';\n" },
        { file: 'docker-compose.yml', slot: 'services', text: '  db:\n    image: postgres\n' },
      ],
    };
    const two: Feature = {
      id: 'two',
      slots: [{ file: 'src/app.ts', slot: 'imports', text: "import two from 'two';\n" }],
    };

    const read = compose([one, two]);

    expect(read('src/app.ts')).toBe(
      "import a from 'a';\nimport one from 'one';\nimport two from 'two';\n\nrun();\n",
    );
    expect(read('docker-compose.yml')).toContain('  db:\n    image: postgres\n');
  });

  it('replaces placeholders in added text too', () => {
    const read = compose([
      {
        id: 'db',
        slots: [{ file: 'src/app.ts', slot: 'middleware', text: "  log('{{PROJECT_NAME}}');\n" }],
      },
    ]);

    expect(read('src/app.ts')).toContain("  log('my-api');\n");
  });

  it("copies a feature's own files, filling their slots and placeholders", () => {
    const read = compose([{ id: 'db', dependencies: { pg: '^8.0.0' } }], {
      'db/src/db/client.ts': "export const name = '{{PROJECT_NAME}}';\n// @slot extra\n",
    });

    expect(read('src/db/client.ts')).toBe("export const name = 'my-api';\n");
    expect(JSON.parse(read('package.json')).dependencies).toEqual({ pg: '^8.0.0' });
  });

  it("refuses a feature file that would replace a template file", () => {
    expect(() =>
      compose([{ id: 'db' }], { 'db/src/app.ts': 'replaced\n' }),
    ).toThrow("src/app.ts already exists; a feature can't replace it.");
  });

  it('refuses a feature that adds to a slot the template no longer has', () => {
    const feature: Feature = {
      id: 'db',
      slots: [{ file: 'src/app.ts', slot: 'routes', text: 'routes();\n' }],
    };

    expect(() => compose([feature])).toThrow(
      'The db feature adds to "@slot routes" in src/app.ts, but there\'s no such slot.',
    );
  });

  it('refuses a feature that adds to a file that does not exist', () => {
    const feature: Feature = {
      id: 'db',
      slots: [{ file: 'src/missing.ts', slot: 'x', text: 'x\n' }],
    };

    expect(() => compose([feature])).toThrow('in src/missing.ts');
  });
});
