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
  const targetDir = path.resolve(process.cwd(), projectName);

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
      pkg.dependencies = pkg.dependencies || {};
      pkg.dependencies['@sibilsoren/gatekeeper'] = '^1.0.0';
    }
    
    if (options.includePrisma) {
      pkg.dependencies = pkg.dependencies || {};
      pkg.devDependencies = pkg.devDependencies || {};
      pkg.dependencies['@prisma/client'] = '^5.10.0';
      pkg.devDependencies['prisma'] = '^5.10.0';
      pkg.scripts = pkg.scripts || {};
      pkg.scripts['db:push'] = 'npx prisma db push';
      pkg.scripts['db:studio'] = 'npx prisma studio';
    }
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
  }

  // Inject Gatekeeper into app.ts
  if (options.includeGatekeeper) {
    const appTsPath = path.join(targetDir, 'src', 'app.ts');
    if (fs.existsSync(appTsPath)) {
      let appTs = fs.readFileSync(appTsPath, 'utf-8');
      appTs = appTs.replace(
        "import { healthRoutes } from './modules/health/health.routes.js';",
        "import { healthRoutes } from './modules/health/health.routes.js';\nimport gatekeeper from '@sibilsoren/gatekeeper';"
      );
      appTs = appTs.replace(
        "// ─── Request Logging ──────────────────────────────────────\n  app.use(requestLogger);",
        "// ─── Request Logging ──────────────────────────────────────\n  app.use(requestLogger);\n\n  // ─── Rate Limiting ────────────────────────────────────────\n  app.use(gatekeeper({ limit: 100, window: 60 }));"
      );
      fs.writeFileSync(appTsPath, appTs);
    }
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
  if (!noGit) {
    currentStep++;
    log.step(currentStep, totalSteps, 'Initializing git repository...');

    try {
      execSync('git init', { cwd: targetDir, stdio: 'ignore' });
      execSync('git add -A', { cwd: targetDir, stdio: 'ignore' });
      execSync('git commit -m "Initial commit from create-api-starterkit"', {
        cwd: targetDir,
        stdio: 'ignore',
      });
      log.success('Git repository initialized');
    } catch {
      log.warning('Git initialization failed (is git installed?)');
    }
  }

  // ─── Step 4: Install dependencies ───────────────────────
  if (!skipInstall) {
    currentStep++;
    const installCmd =
      packageManager === 'pnpm' ? 'pnpm install' : packageManager === 'yarn' ? 'yarn install' : 'npm install';
    const spinner = ora({
      text: `Installing dependencies with ${packageManager}...`,
      prefixText: chalk.blue(`[${currentStep}/${totalSteps}]`),
    }).start();

    try {
      execSync(installCmd, {
        cwd: targetDir,
        stdio: 'ignore',
        timeout: 120_000, // 2 minute timeout
      });
      spinner.succeed('Dependencies installed');
    } catch {
      spinner.fail('Failed to install dependencies');
      log.warning(`Run "${installCmd}" manually in the project directory.`);
    }

    if (options.includePrisma) {
      log.step(++currentStep, totalSteps + 1, 'Initializing Prisma...');
      try {
        const prismaCmd = packageManager === 'pnpm' ? 'pnpm dlx prisma init' : packageManager === 'yarn' ? 'yarn dlx prisma init' : 'npx prisma init';
        execSync(prismaCmd, { cwd: targetDir, stdio: 'ignore' });
        log.success('Prisma initialized');
      } catch {
        log.warning('Failed to initialize Prisma. Run "npx prisma init" manually.');
      }
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
    console.log(
      chalk.cyan(
        `    ${packageManager === 'pnpm' ? 'pnpm install' : 'npm install'}`,
      ),
    );
  }
  console.log(chalk.cyan('    npm run dev'));
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
