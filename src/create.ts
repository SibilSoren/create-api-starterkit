import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import ora from 'ora';
import chalk from 'chalk';
import type { CreateOptions } from './types.js';
import { copyTemplateDir, isDirEmpty } from './utils/fs.js';
import { log } from './utils/logger.js';
import { validateProjectName } from './utils/validate.js';
import {
  configurePnpm,
  detectVersion,
  installCommand,
  runCommand,
} from './utils/package-manager.js';
import {
  GATEKEEPER_PACKAGE,
  GATEKEEPER_VERSION,
  injectGatekeeper,
} from './utils/gatekeeper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main scaffolding function.
 * Creates a new API project from the template.
 */
export async function createProject(options: CreateOptions): Promise<void> {
  const { projectName, skipInstall, noGit, packageManager } = options;
  const totalSteps = 2 + (noGit ? 0 : 1) + (skipInstall ? 0 : 1);
  let currentStep = 0;

  // ─── Validate project name ──────────────────────────────
  const validation = validateProjectName(projectName);
  if (!validation.valid) {
    log.error(validation.message!);
    process.exit(1);
  }

  // ─── Check target directory ─────────────────────────────
  const targetDir = path.resolve(options.cwd ?? process.cwd(), projectName);

  if (!isDirEmpty(targetDir)) {
    log.error(`Directory "${projectName}" already exists and is not empty.`);
    process.exit(1);
  }

  log.blank();
  console.log(
    chalk.bold(`  Creating ${chalk.cyan(projectName)} in ${chalk.dim(targetDir)}`),
  );
  log.blank();

  // ─── Step 1: Copy template files ────────────────────────
  currentStep++;
  log.step(currentStep, totalSteps, 'Scaffolding project...');

  const templateDir = path.resolve(__dirname, '..', 'template');

  // Fallback: if running from source (dev mode), template is adjacent
  const resolvedTemplateDir = fs.existsSync(templateDir)
    ? templateDir
    : path.resolve(__dirname, 'template');

  if (!fs.existsSync(resolvedTemplateDir)) {
    log.error('Template directory not found. This is a bug — please report it.');
    log.error(`Looked in: ${templateDir}`);
    process.exit(1);
  }

  const replacements: Record<string, string> = {
    '{{PROJECT_NAME}}': projectName,
  };

  copyTemplateDir(resolvedTemplateDir, targetDir, replacements);
  
  // ─── Step 1.5: Dynamic Configuration ────────────────────
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    if (options.includeGatekeeper) {
      pkg.dependencies = sortKeys({
        ...pkg.dependencies,
        [GATEKEEPER_PACKAGE]: GATEKEEPER_VERSION,
      });
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  if (options.includeGatekeeper) {
    const appTsPath = path.join(targetDir, 'src', 'app.ts');
    fs.writeFileSync(
      appTsPath,
      injectGatekeeper(fs.readFileSync(appTsPath, 'utf-8')),
    );
  }

  if (packageManager === 'pnpm') {
    configurePnpm(targetDir, detectVersion('pnpm'));
  }

  log.success('Project scaffolded');

  // ─── Step 2: Create .env from .env.example ──────────────
  currentStep++;
  log.step(currentStep, totalSteps, 'Setting up environment...');

  const envExamplePath = path.join(targetDir, '.env.example');
  const envPath = path.join(targetDir, '.env');

  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
  }
  log.success('Environment configured');

  // ─── Step 3: Initialize git ─────────────────────────────
  // Before installing, so husky can set up the pre-commit hook. The first
  // commit comes last, so it includes the lockfile.
  let gitReady = false;
  if (!noGit) {
    currentStep++;
    log.step(currentStep, totalSteps, 'Initializing git repository...');

    try {
      execSync('git init', { cwd: targetDir, stdio: 'ignore' });
      gitReady = true;
      log.success('Git repository initialized');
    } catch {
      log.warning('Git initialization failed (is git installed?)');
    }
  }

  // ─── Step 4: Install dependencies ───────────────────────
  const installCmd = installCommand(packageManager);
  if (!skipInstall) {
    currentStep++;
    const spinner = ora({
      text: `Installing dependencies with ${packageManager}...`,
      prefixText: chalk.blue(`[${currentStep}/${totalSteps}]`),
    }).start();

    try {
      execSync(installCmd, {
        cwd: targetDir,
        stdio: 'pipe',
        timeout: 300_000, // 5 minute timeout
      });
      spinner.succeed('Dependencies installed');
    } catch (error) {
      spinner.fail('Failed to install dependencies');
      printCommandOutput(error);
      log.warning(`Fix the error above, then run "${installCmd}" in the project directory.`);
    }
  }

  // ─── Initial commit ─────────────────────────────────────
  if (gitReady) {
    try {
      execSync('git add -A', { cwd: targetDir, stdio: 'pipe' });
      // --no-verify: the pre-commit hook would lint every file of a template
      // that's already linted.
      execSync(
        'git commit --no-verify -m "Initial commit from create-api-starterkit"',
        { cwd: targetDir, stdio: 'pipe' },
      );
      log.success('Created the initial commit');
    } catch (error) {
      log.warning('Could not create the initial commit:');
      printCommandOutput(error);
    }
  }

  // ─── Done! ──────────────────────────────────────────────
  log.blank();
  console.log(chalk.green.bold('  ✨ Your API is ready!'));
  log.blank();
  console.log('  Next steps:');
  log.blank();
  console.log(chalk.cyan(`    cd ${projectName}`));
  if (skipInstall) {
    console.log(chalk.cyan(`    ${installCmd}`));
  }
  console.log(chalk.cyan(`    ${runCommand(packageManager, 'dev')}`));
  log.blank();
  console.log(
    `  ${chalk.dim('Server:')}       http://localhost:3000`,
  );
  console.log(
    `  ${chalk.dim('Swagger:')}      http://localhost:3000/api-docs`,
  );
  console.log(
    `  ${chalk.dim('Health:')}       http://localhost:3000/api/health`,
  );
  log.blank();
  console.log(chalk.dim('  Happy coding! 🚀'));
  log.blank();
}

/**
 * Sort an object's keys, the way npm keeps dependency lists.
 */
function sortKeys(object: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(object).sort(([a], [b]) => a.localeCompare(b)),
  );
}

/**
 * Print the tail of a failed command's output, so the user sees why it failed.
 */
function printCommandOutput(error: unknown): void {
  const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
  const output = `${stdout?.toString() ?? ''}\n${stderr?.toString() ?? ''}`
    .split('\n')
    .filter((line) => line.trim() !== '')
    .slice(-15);
  for (const line of output) {
    console.log(chalk.dim(`    ${line}`));
  }
}
