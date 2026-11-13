import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import * as schema from './schema.js';

/**
 * The connection pool and the Drizzle client that repositories query
 * through. Connections open on the first query, so importing this is cheap.
 */
const pool = new Pool({ connectionString: env.DATABASE_URL });

// A connection that drops while idle shouldn't crash the app. The pool
// replaces it on the next query.
pool.on('error', (err) => {
  logger.error({ err }, 'Idle database connection failed');
});

export const db = drizzle(pool, { schema });

/**
 * Close every connection, so the process can exit cleanly.
 */
export async function closeDb(): Promise<void> {
  await pool.end();
}
