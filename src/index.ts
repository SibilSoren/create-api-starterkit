import { Command } from 'commander';
import chalk from 'chalk';
import * as p from '@clack/prompts';
import { createProject } from './create.js';
import type { CreateOptions } from './types.js';

const program = new Command();

program
  .name('create-api-starterkit')
  .description('Scaffold a production-ready Node.js + TypeScript + Express API')
  .version('1.0.0')
  .argument('[project-name]', 'Name of the project to create')
  .option('--skip-install', 'Skip npm install', false)
  .option('--no-git', 'Skip git initialization')
  .option('--package-manager <pm>', 'Package manager to use (npm, pnpm, yarn)')
  .action(async (projectNameArg: string | undefined, opts: Record<string, unknown>) => {
    console.log();
    p.intro(chalk.bgCyan.black(' create-api-starterkit '));

    const project = await p.group(
      {
        projectName: () => {
          if (projectNameArg) return Promise.resolve(projectNameArg);
          return p.text({
            message: 'What is the name of your project?',
            placeholder: 'my-awesome-api',
            defaultValue: 'my-api',
            validate: (val) => {
              if (val.length === 0) return 'Project name is required';
            },
          });
        },
        includeGatekeeper: () =>
          p.confirm({
            message: 'Would you like to include Gatekeeper (Distributed Rate Limiter)?',
            initialValue: true,
          }),
        includePrisma: () =>
          p.confirm({
            message: 'Would you like to scaffold Prisma ORM?',
            initialValue: true,
          }),
        packageManager: () => {
          if (opts.packageManager) return Promise.resolve(opts.packageManager as string);
          return p.select({
            message: 'Which package manager do you want to use?',
            options: [
              { value: 'npm', label: 'npm' },
              { value: 'pnpm', label: 'pnpm' },
              { value: 'yarn', label: 'yarn' },
            ],
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
      projectName: project.projectName,
      skipInstall: opts.skipInstall as boolean,
      noGit: !opts.git,
      packageManager: project.packageManager as 'npm' | 'pnpm' | 'yarn',
      includeGatekeeper: project.includeGatekeeper,
      includePrisma: project.includePrisma,
    };

    await createProject(options);

    p.outro(chalk.green('Done!'));
  });

program.parse();
