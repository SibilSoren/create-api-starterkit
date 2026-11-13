import { createRequire } from 'node:module';
import { Command } from 'commander';
import chalk from 'chalk';
import * as p from '@clack/prompts';
import { createProject } from './create.js';
import type { CreateOptions } from './types.js';
import { log } from './utils/logger.js';
import { validateProjectName } from './utils/validate.js';
import { PACKAGE_MANAGERS, isPackageManager } from './utils/package-manager.js';
import { DATABASES, isDatabase } from './features/index.js';

// package.json sits one level up from both src/ and dist/.
const { version } = createRequire(import.meta.url)('../package.json') as {
  version: string;
};

const program = new Command();

program
  .name('create-api-starterkit')
  .description('Scaffold a production-ready Node.js + TypeScript + Express API')
  .version(version)
  .argument('[project-name]', 'Name of the project to create')
  .option('--skip-install', 'Skip installing dependencies', false)
  .option('--no-git', 'Skip git initialization')
  .option('--package-manager <pm>', `Package manager to use (${PACKAGE_MANAGERS.join(', ')})`)
  .option('--gatekeeper', 'Add Gatekeeper rate limiting (default)')
  .option('--no-gatekeeper', 'Skip Gatekeeper rate limiting')
  .option('--db <db>', `Database: ${DATABASES.join(' or ')} (drizzle is PostgreSQL with Drizzle ORM)`)
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (projectNameArg: string | undefined, opts: Record<string, unknown>) => {
    console.log();

    if (opts.packageManager !== undefined && !isPackageManager(opts.packageManager)) {
      log.error(
        `Unknown package manager "${String(opts.packageManager)}". Use one of: ${PACKAGE_MANAGERS.join(', ')}.`,
      );
      process.exit(1);
    }

    if (opts.db !== undefined && !isDatabase(opts.db)) {
      log.error(`Unknown database "${String(opts.db)}". Use one of: ${DATABASES.join(', ')}.`);
      process.exit(1);
    }

    const isCI = process.env.CI || opts.yes;

    if (isCI) {
      const options: CreateOptions = {
        projectName: projectNameArg || 'my-api',
        skipInstall: opts.skipInstall as boolean,
        noGit: !opts.git,
        packageManager: isPackageManager(opts.packageManager) ? opts.packageManager : 'npm',
        includeGatekeeper: (opts.gatekeeper as boolean | undefined) ?? true,
        database: isDatabase(opts.db) ? opts.db : 'none',
      };
      await createProject(options);
      return;
    }

    p.intro(chalk.bgCyan.black(' create-api-starterkit '));

    const project = await p.group(
      {
        projectName: () => {
          if (projectNameArg) return Promise.resolve(projectNameArg);
          return p.text({
            message: 'What is the name of your project?',
            placeholder: 'my-awesome-api',
            defaultValue: 'my-api',
            // Empty means the default name; anything else must be a valid package name.
            validate: (val) => (val ? validateProjectName(val).message : undefined),
          });
        },
        includeGatekeeper: () => {
          if (opts.gatekeeper !== undefined) return Promise.resolve(opts.gatekeeper as boolean);
          return p.confirm({
            message: 'Add rate limiting with Gatekeeper? (100 requests a minute per IP, easy to change)',
            initialValue: true,
          });
        },
        database: () => {
          if (opts.db !== undefined) return Promise.resolve(opts.db as string);
          return p.select({
            message: 'Add a database?',
            options: [
              { value: 'none', label: 'No database' },
              {
                value: 'drizzle',
                label: 'PostgreSQL with Drizzle ORM',
                hint: 'users example, migrations, seed data',
              },
            ],
            initialValue: 'none',
          });
        },
        packageManager: () => {
          if (opts.packageManager) return Promise.resolve(opts.packageManager as string);
          return p.select({
            message: 'Which package manager do you want to use?',
            options: PACKAGE_MANAGERS.map((pm) => ({ value: pm, label: pm })),
            initialValue: 'npm',
          });
        },
      },
      {
        onCancel: () => {
          p.cancel('Operation cancelled.');
          process.exit(0);
        },
      }
    );

    const options: CreateOptions = {
      projectName: project.projectName as string,
      skipInstall: opts.skipInstall as boolean,
      noGit: !opts.git,
      packageManager: isPackageManager(project.packageManager) ? project.packageManager : 'npm',
      includeGatekeeper: project.includeGatekeeper as boolean,
      database: isDatabase(project.database) ? project.database : 'none',
    };

    await createProject(options);

    p.outro(chalk.green('Done!'));
  });

program.parse();
