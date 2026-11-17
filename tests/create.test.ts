import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fillSlots } from '../src/compose/slots.js';
import { createProject } from '../src/create.js';
import type { CreateOptions } from '../src/types.js';

/**
 * Scaffolds real projects (without installing or git) for each combination
 * of options, so a new option can't quietly change what the others generate.
 */

const templateDir = new URL('../template/', import.meta.url);
const templateFile = (name: string) =>
  fs.readFileSync(new URL(name, templateDir), 'utf-8');
// A template file as it is in a project with no extras: slot lines removed.
const withoutSlots = (content: string) =>
  fillSlots(content, new Map(), 'template').content;

let workDir: string;

beforeEach(() => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cas-test-'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  fs.rmSync(workDir, { recursive: true, force: true });
});

async function scaffold(overrides: Partial<CreateOptions> = {}) {
  const options: CreateOptions = {
    projectName: 'my-api',
    skipInstall: true,
    noGit: true,
    packageManager: 'npm',
    includeGatekeeper: false,
    cwd: workDir,
    ...overrides,
  };
  const ready = await createProject(options);

  // A scoped name such as @acme/api goes in a folder named api.
  const dir = path.join(workDir, path.basename(options.projectName));
  const read = (name: string) => fs.readFileSync(path.join(dir, name), 'utf-8');
  const exists = (name: string) => fs.existsSync(path.join(dir, name));
  return { ready, dir, read, exists, pkg: JSON.parse(read('package.json')) };
}

/** Everything createProject printed, without colors. */
function printed(): string {
  return stripVTControlCharacters(
    vi.mocked(console.log).mock.calls.map((args) => args.join(' ')).join('\n'),
  );
}

/**
 * Put a fake npm first on PATH, running the given shell script instead of
 * a real install.
 */
function fakeNpm(script: string) {
  const bin = path.join(workDir, 'bin');
  fs.mkdirSync(bin, { recursive: true });
  fs.writeFileSync(path.join(bin, 'npm'), `#!/bin/sh\n${script}\n`, { mode: 0o755 });
  vi.stubEnv('PATH', `${bin}${path.delimiter}${process.env.PATH}`);
  // ora writes the spinner to stderr.
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
}

function allFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? allFiles(full) : [full];
  });
}

describe('createProject: no extras', () => {
  it('copies the template unchanged apart from the project name and slots', async () => {
    const project = await scaffold();

    expect(project.pkg.name).toBe('my-api');
    expect(project.read('src/app.ts')).toBe(
      withoutSlots(templateFile('src/app.ts')),
    );
    expect(project.read('Dockerfile')).toBe(templateFile('Dockerfile'));
    expect(project.pkg.dependencies).toEqual(
      JSON.parse(templateFile('package.json')).dependencies,
    );
  });

  it('creates .gitignore, .env and the pre-commit hook', async () => {
    const project = await scaffold();

    expect(project.exists('.gitignore')).toBe(true);
    expect(project.exists('_gitignore')).toBe(false);
    expect(project.read('.env')).toBe(templateFile('.env.example'));
    expect(project.read('.husky/pre-commit')).toContain('lint-staged');
  });

  it('adds no pnpm files', async () => {
    const project = await scaffold();

    expect(project.exists('pnpm-workspace.yaml')).toBe(false);
    expect(project.pkg.packageManager).toBeUndefined();
  });
});

describe('createProject: every combination', () => {
  it.each([
    { packageManager: 'npm', includeGatekeeper: false },
    { packageManager: 'npm', includeGatekeeper: true },
    { packageManager: 'pnpm', includeGatekeeper: false },
    { packageManager: 'pnpm', includeGatekeeper: true },
  ] as const)(
    'leaves no placeholder or slot line ($packageManager, gatekeeper: $includeGatekeeper)',
    async (overrides) => {
      const project = await scaffold(overrides);

      for (const file of allFiles(project.dir)) {
        const content = fs.readFileSync(file, 'utf-8');
        expect(content, file).not.toMatch(/\{\{[A-Z_]+\}\}/);
        expect(content, file).not.toMatch(/@slot\b/);
      }
    },
  );
});

describe('createProject: --gatekeeper', () => {
  it('adds the dependency and the middleware', async () => {
    const project = await scaffold({ includeGatekeeper: true });

    expect(project.pkg.dependencies['@sibilsoren/gatekeeper']).toBe('^2.0.0');
    expect(Object.keys(project.pkg.dependencies)).toEqual(
      Object.keys(project.pkg.dependencies).sort(),
    );
    expect(project.read('src/app.ts')).toContain(
      "app.use(gatekeeper({ limit: 100, window: '1m' }));",
    );
  });

  it('changes nothing else', async () => {
    const project = await scaffold({ includeGatekeeper: true });

    expect(project.read('Dockerfile')).toBe(templateFile('Dockerfile'));
    expect(project.read('README.md')).toBe(
      templateFile('README.md')
        .replaceAll('{{PROJECT_NAME}}', 'my-api')
        .replaceAll('{{IMAGE_NAME}}', 'my-api'),
    );
  });
});

describe('createProject: scoped names', () => {
  it('creates the project in a folder named without the scope', async () => {
    const project = await scaffold({ projectName: '@acme/api' });

    expect(project.dir).toBe(path.join(workDir, 'api'));
    expect(fs.existsSync(path.join(workDir, '@acme'))).toBe(false);
    expect(project.pkg.name).toBe('@acme/api');
    expect(printed()).toContain('cd api\n');
  });

  it('names the Docker image after the folder', async () => {
    const project = await scaffold({ projectName: '@acme/api' });

    // Docker image names can't contain "@".
    expect(project.read('README.md')).toContain('docker build -t api .');
    expect(project.read('README.md')).toContain('docker run -p 3000:3000 api');
    expect(project.read('README.md')).toMatch(/^# @acme\/api$/m);
  });
});

describe('createProject: installing dependencies', () => {
  it("doesn't block while installing, so the spinner keeps turning", async () => {
    fakeNpm('sleep 0.5');
    let ticks = 0;
    const timer = setInterval(() => ticks++, 20);

    const project = await scaffold({ skipInstall: false });
    clearInterval(timer);

    expect(project.ready).toBe(true);
    expect(ticks).toBeGreaterThan(5);
    expect(printed()).toContain('Your API is ready!');
  });

  it("says the project isn't ready when the install fails", async () => {
    fakeNpm('echo "npm error 404 Not Found - @sibilsoren/nope" >&2\nexit 1');

    const project = await scaffold({ skipInstall: false });

    expect(project.ready).toBe(false);
    const output = printed();
    expect(output).not.toContain('Your API is ready!');
    expect(output).toContain('npm error 404 Not Found');
    expect(output).toMatch(/cd my-api\n\s+npm install\n\s+npm run dev/);
    // The files are all there, so the install is all that's left to do.
    expect(project.exists('src/app.ts')).toBe(true);
  });
});

describe('createProject: --package-manager pnpm', () => {
  it('adds pnpm settings and switches the Dockerfile and README', async () => {
    const project = await scaffold({ packageManager: 'pnpm' });

    expect(project.read('pnpm-workspace.yaml')).toContain('esbuild: true');
    expect(project.read('Dockerfile')).toContain('pnpm install --frozen-lockfile');
    expect(project.read('Dockerfile')).not.toContain('npm ci');
    expect(project.read('README.md')).toContain('pnpm dev');
  });

  it('works together with --gatekeeper', async () => {
    const project = await scaffold({
      packageManager: 'pnpm',
      includeGatekeeper: true,
    });

    expect(project.pkg.dependencies['@sibilsoren/gatekeeper']).toBe('^2.0.0');
    expect(project.exists('pnpm-workspace.yaml')).toBe(true);
  });
});

describe('createProject: refuses bad input', () => {
  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  it('rejects an invalid project name', async () => {
    await expect(scaffold({ projectName: 'My API' })).rejects.toThrow(
      'process.exit(1)',
    );
  });

  it("doesn't overwrite a folder that isn't empty", async () => {
    fs.mkdirSync(path.join(workDir, 'my-api'));
    fs.writeFileSync(path.join(workDir, 'my-api', 'keep.txt'), 'mine');

    await expect(scaffold()).rejects.toThrow('process.exit(1)');
    expect(fs.readFileSync(path.join(workDir, 'my-api', 'keep.txt'), 'utf-8')).toBe(
      'mine',
    );
  });
});
