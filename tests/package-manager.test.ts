import fs from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  isPackageManager,
  runCommand,
  toPnpmDockerfile,
  toPnpmReadme,
} from '../src/utils/package-manager.js';

const templateFile = (name: string) =>
  fs.readFileSync(new URL(`../template/${name}`, import.meta.url), 'utf-8');

describe('isPackageManager', () => {
  it('accepts npm and pnpm only', () => {
    expect(isPackageManager('npm')).toBe(true);
    expect(isPackageManager('pnpm')).toBe(true);
    expect(isPackageManager('yarn')).toBe(false);
    expect(isPackageManager(undefined)).toBe(false);
  });
});

describe('runCommand', () => {
  it('uses "npm run" for npm and the bare script for pnpm', () => {
    expect(runCommand('npm', 'dev')).toBe('npm run dev');
    expect(runCommand('pnpm', 'dev')).toBe('pnpm dev');
  });
});

describe('toPnpmDockerfile', () => {
  it('replaces every npm command in the template Dockerfile', () => {
    const dockerfile = toPnpmDockerfile(templateFile('Dockerfile'));

    expect(dockerfile).not.toMatch(/\bnpm (ci|run|cache)\b/);
    expect(dockerfile).toContain(
      'pnpm install --frozen-lockfile --ignore-scripts',
    );
    expect(dockerfile).toContain(
      'pnpm install --frozen-lockfile --prod --ignore-scripts',
    );
  });

  it('fails loudly if the template no longer matches', () => {
    expect(() => toPnpmDockerfile('FROM node:24-alpine\n')).toThrow(
      /Dockerfile template changed/,
    );
  });
});

describe('toPnpmReadme', () => {
  it('switches the template README to pnpm commands', () => {
    const readme = toPnpmReadme(templateFile('README.md'));

    expect(readme).not.toMatch(/\bnpm (run|install|test|start)\b/);
    expect(readme).toContain('pnpm dev');
    expect(readme).toContain('pnpm test:coverage');
  });
});
