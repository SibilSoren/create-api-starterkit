export interface CreateOptions {
  /** Project name (directory name) */
  projectName: string;
  /** Skip npm install */
  skipInstall: boolean;
  /** Skip git init */
  noGit: boolean;
  /** Package manager to use */
  packageManager: 'npm' | 'pnpm' | 'yarn';
  /** Include Gatekeeper rate limiter */
  includeGatekeeper: boolean;
  /** Include Prisma ORM */
  includePrisma: boolean;
}
