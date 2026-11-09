import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export const PACKAGE_MANAGERS = ['npm', 'pnpm'] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export function isPackageManager(value: unknown): value is PackageManager {
  return PACKAGE_MANAGERS.includes(value as PackageManager);
}

export function installCommand(pm: PackageManager): string {
  return `${pm} install`;
}

/**
 * The command to run a package.json script, e.g. "npm run dev" or "pnpm dev".
 */
export function runCommand(pm: PackageManager, script: string): string {
  return pm === 'npm' ? `npm run ${script}` : `${pm} ${script}`;
}

/**
 * The installed version of a package manager, or null if it isn't installed.
 */
export function detectVersion(pm: PackageManager): string | null {
  try {
    return execSync(`${pm} --version`, { stdio: 'pipe' }).toString().trim();
  } catch {
    return null;
  }
}

// pnpm 10+ blocks dependency build scripts unless they're allowed, and newer
// versions fail the install over it. esbuild (used by tsx and vitest) needs
// its script; @scarf/scarf (analytics in swagger-ui-dist) doesn't.
const PNPM_WORKSPACE = `allowBuilds:
  esbuild: true
  '@scarf/scarf': false
`;

// Each pair must match the template's Dockerfile exactly.
const PNPM_DOCKERFILE_REPLACEMENTS: Array<[string, string]> = [
  [
    'COPY package*.json ./\nRUN npm ci --ignore-scripts',
    'COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./\nRUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts',
  ],
  ['RUN npm run build', 'RUN pnpm run build'],
  [
    'COPY package*.json ./\nRUN npm ci --omit=dev --ignore-scripts && npm cache clean --force',
    'COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./\nRUN corepack enable && pnpm install --frozen-lockfile --prod --ignore-scripts',
  ],
];

/**
 * Rewrite the npm-based Dockerfile for pnpm. Throws if the template no longer
 * matches, so a template change can't silently produce a broken Dockerfile.
 */
export function toPnpmDockerfile(dockerfile: string): string {
  return PNPM_DOCKERFILE_REPLACEMENTS.reduce((content, [from, to]) => {
    if (!content.includes(from)) {
      throw new Error(`Dockerfile template changed; can't find: ${from}`);
    }
    return content.replace(from, to);
  }, dockerfile);
}

/**
 * Point README commands at pnpm ("npm run dev" → "pnpm dev").
 */
export function toPnpmReadme(readme: string): string {
  return readme
    .replace(/npm run ([\w:-]+)/g, 'pnpm $1')
    .replace(/npm (install|test|start)\b/g, 'pnpm $1');
}

/**
 * Adjust a freshly copied template for pnpm: allow the build scripts it needs,
 * pin the pnpm version for corepack (used by the Dockerfile), and switch the
 * Dockerfile and README from npm to pnpm.
 */
export function configurePnpm(targetDir: string, pnpmVersion: string | null) {
  fs.writeFileSync(path.join(targetDir, 'pnpm-workspace.yaml'), PNPM_WORKSPACE);

  if (pnpmVersion) {
    const packageJsonPath = path.join(targetDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    pkg.packageManager = `pnpm@${pnpmVersion}`;
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  const dockerfilePath = path.join(targetDir, 'Dockerfile');
  fs.writeFileSync(
    dockerfilePath,
    toPnpmDockerfile(fs.readFileSync(dockerfilePath, 'utf-8')),
  );

  const readmePath = path.join(targetDir, 'README.md');
  fs.writeFileSync(
    readmePath,
    toPnpmReadme(fs.readFileSync(readmePath, 'utf-8')),
  );
}
