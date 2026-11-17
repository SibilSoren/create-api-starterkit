import fs from 'node:fs';
import os from 'node:os';
import { describe, it, expect } from 'vitest';
import { CommandError, execAsync } from '../src/utils/exec.js';

const cwd = os.tmpdir();

/** Run a shell script through execAsync and return what it rejected with. */
function failure(script: string, timeout = 5_000): Promise<CommandError> {
  return execAsync('sh', ['-c', script], { cwd, timeout }).then(
    () => {
      throw new Error('Expected the command to fail');
    },
    (error: CommandError) => error,
  );
}

describe('execAsync', () => {
  it('resolves when the command succeeds', async () => {
    await expect(execAsync('sh', ['-c', 'exit 0'], { cwd, timeout: 5_000 })).resolves.toBeUndefined();
  });

  it('keeps the output of a failed command', async () => {
    const error = await failure('echo first; echo second >&2; exit 3');

    expect(error).toBeInstanceOf(CommandError);
    expect(error.message).toBe('"sh -c echo first; echo second >&2; exit 3" exited with code 3.');
    expect(error.output).toContain('first');
    expect(error.output).toContain('second');
  });

  it('keeps only the end of a long output', async () => {
    const error = await failure(
      'i=0; while [ $i -lt 20000 ]; do echo "line $i"; i=$((i+1)); done; exit 1',
      10_000,
    );

    expect(error.output.length).toBeLessThanOrEqual(64 * 1024);
    expect(error.output).toContain('line 19999');
    expect(error.output).not.toContain('line 0\n');
  });

  it('stops a command that runs past the timeout', async () => {
    const started = Date.now();
    const error = await execAsync('sleep', ['5'], { cwd, timeout: 200 }).catch(
      (e: CommandError) => e,
    );

    expect(Date.now() - started).toBeLessThan(4_000);
    expect(error.message).toBe('"sleep 5" took longer than 0.2 seconds and was stopped.');
  });

  it("doesn't wait for processes the command started", async () => {
    // The shell runs sleep as a child, which keeps the output open after the
    // shell is stopped. npm and its install scripts can do the same.
    const started = Date.now();
    const error = await failure('sleep 5; echo done', 200);

    expect(Date.now() - started).toBeLessThan(4_000);
    expect(error.message).toContain('took longer than 0.2 seconds');
  });

  it("says when the program isn't installed", async () => {
    const error = await execAsync('no-such-package-manager', ['install'], {
      cwd,
      timeout: 5_000,
    }).catch((e: CommandError) => e);

    expect(error.message).toBe("Couldn't find no-such-package-manager. Is it installed?");
  });

  it('runs in the given directory', async () => {
    const error = await failure('pwd -P; exit 1');

    expect(error.output.trim()).toBe(fs.realpathSync(cwd));
  });
});
