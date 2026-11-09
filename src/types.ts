import type { PackageManager } from './utils/package-manager.js';

export interface CreateOptions {
  /** Project name (directory name) */
  projectName: string;
  /** Skip npm install */
  skipInstall: boolean;
  /** Skip git init */
  noGit: boolean;
  /** Package manager to use */
  packageManager: PackageManager;
  /** Include Gatekeeper rate limiter */
  includeGatekeeper: boolean;
  /** Directory to create the project in (default: the current directory) */
  cwd?: string;
}
