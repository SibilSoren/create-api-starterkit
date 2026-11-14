import type { Feature } from './types.js';

/**
 * PostgreSQL with Drizzle ORM, and a users module as the example. Its own
 * files are in features/drizzle/: the schema, client, migrations and seed
 * script, the users module and its tests on an in-memory Postgres (PGlite).
 */
export const drizzle: Feature = {
  id: 'drizzle',
  dependencies: {
    'drizzle-orm': '^0.45.4',
    pg: '^8.23.1',
  },
  devDependencies: {
    '@electric-sql/pglite': '^0.5.16',
    '@types/pg': '^8.23.1',
    'drizzle-kit': '^0.31.11',
  },
  scripts: {
    'db:generate': 'drizzle-kit generate',
    'db:migrate': 'tsx src/db/migrate.ts',
    'db:seed': 'tsx src/db/seed.ts',
  },
  slots: [
    // ─── Code ──────────────────────────────────────────────
    {
      file: 'src/app.ts',
      slot: 'imports',
      text: "import { userRoutes } from './modules/users/users.routes.js';\n",
    },
    {
      file: 'src/app.ts',
      slot: 'routes',
      text: `
  // ─── Users ────────────────────────────────────────────────
  // An example module backed by Postgres. See src/modules/users.
  app.use('/api/users', userRoutes);
`,
    },
    {
      file: 'src/server.ts',
      slot: 'imports',
      text: "import { closeDb } from './db/client.js';\n",
    },
    {
      file: 'src/server.ts',
      slot: 'shutdown',
      text: `    await closeDb();
    logger.info('Database connections closed.');
`,
    },
    {
      file: 'src/config/env.ts',
      slot: 'env',
      text: `
  // Postgres connection string, e.g. postgres://user:password@host:5432/db
  DATABASE_URL: z.url(),
`,
    },
    {
      file: '.env.example',
      slot: 'env',
      text: `
# Postgres. "docker compose up -d db" starts one that matches this URL.
DATABASE_URL=postgres://postgres:postgres@localhost:5432/app
`,
    },

    // ─── Docker ────────────────────────────────────────────
    {
      file: 'Dockerfile',
      slot: 'production-files',
      text: `
# Migrations, applied by node dist/db/migrate.js
COPY drizzle ./drizzle
`,
    },
    {
      file: 'docker-compose.yml',
      slot: 'api-environment',
      text: '      - DATABASE_URL=postgres://postgres:postgres@db:5432/app\n',
    },
    {
      file: 'docker-compose.yml',
      slot: 'api',
      text: `    # Apply new migrations, then start the API.
    command: ["sh", "-c", "node dist/db/migrate.js && node dist/server.js"]
    depends_on:
      db:
        condition: service_healthy
`,
    },
    {
      file: 'docker-compose.yml',
      slot: 'services',
      text: `
  db:
    image: postgres:18-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=app
    # Only reachable from this machine. The password is for local use only.
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - db-data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d app"]
      interval: 5s
      timeout: 3s
      retries: 10
`,
    },
    {
      file: 'docker-compose.yml',
      slot: 'volumes',
      text: `
volumes:
  db-data:
`,
    },

    // ─── README ────────────────────────────────────────────
    {
      file: 'README.md',
      slot: 'endpoints',
      text: `| \`/api/users\` | GET, POST | List users, create a user |
| \`/api/users/{id}\` | GET | Get a user |
`,
    },
    {
      file: 'README.md',
      slot: 'scripts',
      text: `| \`npm run db:generate\` | Write a migration for changes in \`src/db/schema.ts\` |
| \`npm run db:migrate\` | Apply new migrations |
| \`npm run db:seed\` | Add the sample users |
`,
    },
    {
      file: 'README.md',
      slot: 'env',
      text: '| `DATABASE_URL` | none | Postgres connection string. Required. |\n',
    },
    {
      file: 'README.md',
      slot: 'sections',
      text: `## Database

PostgreSQL with [Drizzle ORM](https://orm.drizzle.team). Tables are defined in \`src/db/schema.ts\`, and each module keeps its queries in one repository file, such as \`src/modules/users/users.repository.ts\`.

\`\`\`bash
# Start Postgres in Docker, matching DATABASE_URL in .env
docker compose up -d db

# Create the tables, then add the sample users
npm run db:migrate
npm run db:seed
\`\`\`

After changing \`src/db/schema.ts\`, run \`npm run db:generate\` to write a migration into \`drizzle/\`. Check it and commit it. \`npm run db:migrate\` applies it. In production, run \`node dist/db/migrate.js\` before starting the server; \`docker compose up\` does this for you.

Tests use an in-memory Postgres ([PGlite](https://pglite.dev)) with the same migrations, so they don't need a database.

`,
    },
    {
      file: 'README.md',
      slot: 'tech-stack',
      text: '- **Database**: PostgreSQL + Drizzle ORM\n',
    },
  ],
};
