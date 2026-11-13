# create-api-starterkit

[![npm version](https://img.shields.io/npm/v/create-api-starterkit.svg)](https://www.npmjs.com/package/create-api-starterkit)
[![CI](https://github.com/SibilSoren/create-api-starterkit/actions/workflows/ci.yml/badge.svg)](https://github.com/SibilSoren/create-api-starterkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Scaffold a production-ready **Node.js + TypeScript + Express** API with a single command.

```bash
npx create-api-starterkit my-api
```

Answer a few questions, or add `--yes` to take the defaults. Requires Node.js 22.12 or later.

## What You Get

A fully configured API project with:

- ⚡ **Express 5** — latest stable framework
- 🔒 **TypeScript** — strict mode, type-safe everything
- ✅ **Zod** — runtime validation for requests and env vars
- 📚 **Swagger** — interactive API docs at `/api-docs`
- 🧪 **Vitest + Supertest** — fast testing out of the box
- 📝 **Pino** — structured, high-performance logging
- 🛡️ **Helmet + CORS** — security headers configured
- 🐳 **Docker** — multi-stage Dockerfile + docker-compose
- 🎨 **ESLint + Prettier** — consistent code style
- 🪝 **Husky + lint-staged** — git hooks for quality
- 🚦 **Rate limiting** (optional) — [Gatekeeper](https://github.com/SibilSoren/gatekeeper), 100 requests a minute per IP by default. Behind a load balancer, set `TRUST_PROXY` in the generated project.
- 🗄️ **PostgreSQL + Drizzle** (optional) — a users module with migrations, seed data, docker-compose Postgres, and tests on an in-memory Postgres ([PGlite](https://pglite.dev))

## Quick Start

```bash
# Create a new project
npx create-api-starterkit my-api

# Start developing
cd my-api
npm run dev
```

Your API is now running:
- 🌐 **Server**: http://localhost:3000
- 📚 **Swagger Docs**: http://localhost:3000/api-docs
- 🏥 **Health Check**: http://localhost:3000/api/health

## CLI Options

```bash
npx create-api-starterkit <project-name> [options]
```

| Option | Description | Default |
|---|---|---|
| `-y, --yes` | Skip the questions and use the defaults | asks |
| `--gatekeeper` / `--no-gatekeeper` | Add or skip Gatekeeper rate limiting | add |
| `--db <db>` | `none`, or `drizzle` for PostgreSQL with Drizzle ORM | `none` |
| `--package-manager <pm>` | Use `npm` or `pnpm` | `npm` |
| `--skip-install` | Skip dependency installation | `false` |
| `--no-git` | Skip git initialization | `false` |

Any option you pass on the command line isn't asked again. In CI (when `CI` is set), it never asks.

## Generated Project Structure

```
my-api/
├── src/
│   ├── config/           # Env validation, Swagger setup
│   ├── middlewares/       # Error handling, logging, validation
│   ├── modules/           # Feature modules (add yours here!)
│   │   └── health/        # Example health check module
│   ├── utils/             # ApiError, ApiResponse, Logger
│   ├── app.ts             # Express app factory
│   └── server.ts          # Entry point
├── tests/                 # Integration tests
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml
└── ...config files
```

## Adding Features

Adding a new API module is simple:

1. Create `src/modules/your-feature/`
2. Add `your-feature.schema.ts` (Zod schemas)
3. Add `your-feature.controller.ts` (request handlers)
4. Add `your-feature.routes.ts` (routes + Swagger JSDoc)
5. Register in `src/app.ts`

See the `health` module for a complete example.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Good First Issues

Look for the `good first issue` label to get started.

## License

[MIT](LICENSE) © [SibilSoren](https://github.com/SibilSoren)
