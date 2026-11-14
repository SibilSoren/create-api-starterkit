import { defineConfig } from 'drizzle-kit';

// drizzle-kit doesn't read .env on its own.
try {
  process.loadEnvFile();
} catch {
  // No .env file — use the environment as it is.
}

/**
 * Settings for drizzle-kit, used by `npm run db:generate`.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
