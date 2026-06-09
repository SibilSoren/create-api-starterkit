import chalk from 'chalk';

/**
 * CLI logger with colored output.
 */
export const log = {
  info: (message: string) => console.log(chalk.cyan('ℹ'), message),
  success: (message: string) => console.log(chalk.green('✔'), message),
  warning: (message: string) => console.log(chalk.yellow('⚠'), message),
  error: (message: string) => console.log(chalk.red('✖'), message),
  step: (step: number, total: number, message: string) =>
    console.log(chalk.blue(`[${step}/${total}]`), message),
  blank: () => console.log(),
};
