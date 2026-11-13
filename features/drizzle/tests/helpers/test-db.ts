import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '../../src/db/schema.js';

/**
 * An in-memory Postgres (PGlite) with every migration in drizzle/ applied.
 * It has the same exports as src/db/client.ts, so a test can use it in place
 * of the real database:
 *
 *   vi.mock('../../src/db/client.js', () => import('../helpers/test-db.js'));
 */
const client = new PGlite();

export const db = drizzle(client, { schema });

await migrate(db, {
  migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)),
});

export async function closeDb(): Promise<void> {
  await client.close();
}
