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
export const envSchema = z.object({
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

  // The proxies in front of the app, such as a load balancer or a CDN. Express
  // reads the client's IP from X-Forwarded-For through them, and rate limiting
  // counts requests by that IP. Use a hop count (1 for one load balancer) or
  // the proxies' addresses and subnets. 0 means there's no proxy.
  TRUST_PROXY: z
    .string()
    .default('0')
    .refine(
      (value) => value.trim().toLowerCase() !== 'true',
      'true would let any client choose its own IP. Use a hop count such as 1, or the proxy addresses.',
    )
    .transform((value) => {
      const trimmed = value.trim();
      if (trimmed === '' || trimmed.toLowerCase() === 'false') return 0;
      return /^\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
    }),
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
