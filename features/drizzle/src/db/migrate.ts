import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { logger } from '../utils/logger.js';
import { closeDb, db } from './client.js';

/**
 * Apply the migrations in drizzle/ that haven't run yet.
 *
 *   Development:  npm run db:migrate
 *   Production:   node dist/db/migrate.js
 */

// drizzle/ is at the project root, two levels up from src/db/ and dist/db/.
const migrationsFolder = fileURLToPath(
  new URL('../../drizzle', import.meta.url),
);

try {
  await migrate(db, { migrationsFolder });
  logger.info('Database migrations applied.');
} finally {
  await closeDb();
}
