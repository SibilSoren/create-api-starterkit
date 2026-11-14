import { pathToFileURL } from 'node:url';
import { logger } from '../utils/logger.js';
import { closeDb, db } from './client.js';
import { users } from './schema.js';

/**
 * Sample users for development and tests.
 */
export const sampleUsers = [
  { name: 'Asha Rao', email: 'asha@example.com' },
  { name: 'Ravi Kumar', email: 'ravi@example.com' },
  { name: 'Meera Iyer', email: 'meera@example.com' },
];

/**
 * Add the sample users. Running it again adds nothing, because users whose
 * email is already in the table are skipped.
 */
export async function seed(): Promise<void> {
  await db
    .insert(users)
    .values(sampleUsers)
    .onConflictDoNothing({ target: users.email });
}

// npm run db:seed (or node dist/db/seed.js) runs this file directly.
const runDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (runDirectly) {
  try {
    await seed();
    logger.info(`Sample users are in the database (${sampleUsers.length}).`);
  } finally {
    await closeDb();
  }
}
