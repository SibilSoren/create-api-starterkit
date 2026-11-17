import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import ora from 'ora';
import chalk from 'chalk';
import type { CreateOptions } from './types.js';
import { CommandError, execAsync } from './utils/exec.js';
import { isDirEmpty } from './utils/fs.js';
import { log } from './utils/logger.js';
import { validateProjectName } from './utils/validate.js';
import {
  configurePnpm,
  detectVersion,
  installCommand,
  runCommand,
} from './utils/package-manager.js';
import { composeProject } from './compose/project.js';
import { selectFeatures } from './features/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INSTALL_TIMEOUT = 5 * 60_000;

/**
 * Main scaffolding function.
 * Creates a new API project from the template. Returns false if the project
 * was created but installing its dependencies failed.
 */
export async function createProject(options: CreateOptions): Promise<boolean> {
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
  const dirName = directoryName(projectName);
  const targetDir = path.resolve(options.cwd ?? process.cwd(), dirName);

  if (!isDirEmpty(targetDir)) {
    log.error(`Directory "${dirName}" already exists and is not empty.`);
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

  composeProject({
    templateDir: resolvedTemplateDir,
    featuresDir: path.resolve(resolvedTemplateDir, '..', 'features'),
    targetDir,
    features: selectFeatures(options),
    replacements: {
      '{{PROJECT_NAME}}': projectName,
      // Docker image names can't contain "@", so they use the folder's name.
      '{{IMAGE_NAME}}': dirName,
    },
  });

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
  let installFailed = false;
  if (!skipInstall) {
    currentStep++;
    const spinner = ora({
      text: `Installing dependencies with ${packageManager}...`,
      prefixText: chalk.blue(`[${currentStep}/${totalSteps}]`),
      // ora clears lines forever on a terminal that reports 0 columns, such as
      // `docker run -t` started from a script. Print plain lines there.
      isEnabled: process.stderr.columns === 0 ? false : undefined,
    }).start();

    try {
      // Not execSync: it would block the spinner until the install finished.
      await execAsync(packageManager, ['install'], {
        cwd: targetDir,
        timeout: INSTALL_TIMEOUT,
      });
      spinner.succeed('Dependencies installed');
    } catch (error) {
      spinner.fail('Failed to install dependencies');
      printCommandOutput(error);
      installFailed = true;
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
  if (installFailed) {
    console.log(
      chalk.red.bold(`  ✖ ${dirName} is created, but its dependencies aren't installed.`),
    );
    log.blank();
    console.log('  Fix the error above, then finish with:');
  } else {
    console.log(chalk.green.bold('  ✨ Your API is ready!'));
    log.blank();
    console.log('  Next steps:');
  }
  log.blank();
  console.log(chalk.cyan(`    cd ${dirName}`));
  if (skipInstall || installFailed) {
    console.log(chalk.cyan(`    ${installCmd}`));
  }
  console.log(chalk.cyan(`    ${runCommand(packageManager, 'dev')}`));
  log.blank();
  if (installFailed) {
    return false;
  }
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
  return true;
}

/**
 * The folder for a project: its name without the scope, so @acme/api goes in
 * ./api rather than ./@acme/api.
 */
function directoryName(projectName: string): string {
  return projectName.startsWith('@')
    ? projectName.slice(projectName.indexOf('/') + 1)
    : projectName;
}

/**
 * Print the tail of a failed command's output, so the user sees why it failed.
 */
function printCommandOutput(error: unknown): void {
  let text: string;
  if (error instanceof CommandError) {
    text = `${error.output}\n${error.message}`;
  } else {
    const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
    text = `${stdout?.toString() ?? ''}\n${stderr?.toString() ?? ''}`;
  }
  const output = text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .slice(-15);
  for (const line of output) {
    console.log(chalk.dim(`    ${line}`));
  }
}
