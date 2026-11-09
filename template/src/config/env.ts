import { z } from 'zod';

// Load .env if there is one. Variables already set in the environment win,
// and production usually has no .env file at all.
try {
  process.loadEnvFile();
} catch {
  // No .env file — use the environment as it is.
}

/**
 * Environment variable schema.
 * The app will crash immediately at startup with a clear error message
 * if any required env vars are missing or invalid.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z.coerce.number().positive().default(3000),

  HOST: z.string().default('0.0.0.0'),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  // "*" or a comma-separated list, e.g. "https://app.example.com,https://admin.example.com"
  CORS_ORIGIN: z
    .string()
    .default('*')
    .transform((value) =>
      value === '*' ? '*' : value.split(',').map((origin) => origin.trim()),
    ),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(z.flattenError(parsed.error).fieldErrors, null, 2),
  );
  process.exit(1);
}

export const env: Env = parsed.data;
