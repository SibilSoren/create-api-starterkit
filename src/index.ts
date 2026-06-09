import { Command } from 'commander';
import chalk from 'chalk';
import { createProject } from './create.js';
import type { CreateOptions } from './types.js';

const program = new Command();

program
  .name('create-api-starterkit')
  .description(
    'Scaffold a production-ready Node.js + TypeScript + Express API',
  )
  .version('1.0.0')
  .argument('<project-name>', 'Name of the project to create')
  .option('--skip-install', 'Skip npm install', false)
  .option('--no-git', 'Skip git initialization')
  .option(
    '--package-manager <pm>',
    'Package manager to use (npm or pnpm)',
    'npm',
  )
  .action(async (projectName: string, opts: Record<string, unknown>) => {
    console.log();
    console.log(
      chalk.bold.cyan('  create-api-starterkit'),
      chalk.dim('v1.0.0'),
    );

    const options: CreateOptions = {
      projectName,
      skipInstall: opts.skipInstall as boolean,
      noGit: !opts.git, // commander converts --no-git to git: false
      packageManager: (opts.packageManager as string) === 'pnpm' ? 'pnpm' : 'npm',
    };

    await createProject(options);
  });

program.parse();
