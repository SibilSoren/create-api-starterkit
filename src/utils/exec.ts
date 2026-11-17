import { spawn } from 'node:child_process';

/** How much of a command's output to keep, from the end. */
const MAX_OUTPUT = 64 * 1024;

/**
 * A command that failed, with the end of what it printed.
 */
export class CommandError extends Error {
  constructor(
    message: string,
    readonly output: string,
  ) {
    super(message);
    this.name = 'CommandError';
  }
}

function describeDuration(ms: number): string {
  return ms >= 60_000 ? `${ms / 60_000} minutes` : `${ms / 1000} seconds`;
}

/**
 * Run a program without blocking, so a spinner keeps turning while it runs.
 * Rejects with a CommandError if it fails or runs past the timeout.
 */
export function execAsync(
  file: string,
  args: string[],
  options: { cwd: string; timeout: number },
): Promise<void> {
  const command = [file, ...args].join(' ');

  return new Promise((resolve, reject) => {
    // Windows needs a shell to run npm.cmd and pnpm.cmd. Elsewhere the program
    // runs directly, so the timeout stops it rather than a shell around it.
    const stdio: ['ignore', 'pipe', 'pipe'] = ['ignore', 'pipe', 'pipe'];
    const child =
      process.platform === 'win32'
        ? spawn(command, { cwd: options.cwd, shell: true, stdio })
        : spawn(file, args, { cwd: options.cwd, stdio });

    let output = '';
    const keep = (chunk: string) => {
      output = (output + chunk).slice(-MAX_OUTPUT);
    };
    child.stdout.setEncoding('utf-8').on('data', keep);
    child.stderr.setEncoding('utf-8').on('data', keep);

    const timer = setTimeout(() => {
      child.kill();
      // Anything it started may still hold the output open; don't wait for it.
      child.stdout.destroy();
      child.stderr.destroy();
      const duration = describeDuration(options.timeout);
      reject(new CommandError(`"${command}" took longer than ${duration} and was stopped.`, output));
    }, options.timeout);

    child.on('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      const message =
        error.code === 'ENOENT' ? `Couldn't find ${file}. Is it installed?` : error.message;
      reject(new CommandError(message, output));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new CommandError(`"${command}" exited with code ${code}.`, output));
      }
    });
  });
}
