# {{PROJECT_NAME}}

A scalable API built with Node.js, TypeScript, and Express.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The server will start at `http://localhost:3000`.

## Available Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api-docs` | GET | Swagger UI documentation |
<!-- @slot endpoints -->

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run typecheck` | Type-check the source and the tests without building |
| `npm start` | Run production build |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without changing files |
<!-- @slot scripts -->

A pre-commit hook (husky + lint-staged) runs ESLint and Prettier on the files you commit.

## Project Structure

```
src/
├── config/           # Environment & configuration
│   ├── env.ts        # Zod-validated environment variables
│   └── swagger.ts    # OpenAPI/Swagger configuration
├── middlewares/       # Express middlewares
│   ├── error-handler.ts   # Global error handling
│   ├── not-found.ts       # 404 handler
│   ├── request-logger.ts  # HTTP request logging
│   └── validate.ts        # Zod validation middleware
├── modules/          # Feature modules (add yours here!)
│   └── health/       # Health check module
│       ├── health.controller.ts
│       ├── health.routes.ts
│       └── health.schema.ts
├── utils/            # Shared utilities
│   ├── api-error.ts  # Custom error class
│   ├── api-response.ts # Standardized responses
│   └── logger.ts     # Pino logger
├── app.ts            # Express app setup
└── server.ts         # Server entry point
```

## Adding a New Module

1. Create a new folder in `src/modules/`:
   ```
   src/modules/users/
   ├── users.controller.ts
   ├── users.routes.ts
   └── users.schema.ts
   ```

2. Define your Zod schemas in `users.schema.ts`
3. Write your request handlers in `users.controller.ts`
4. Define routes with Swagger JSDoc annotations in `users.routes.ts`
5. Register routes in `src/app.ts`:
   ```typescript
   import { userRoutes } from './modules/users/users.routes.js';
   app.use('/api/users', userRoutes);
   ```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `LOG_LEVEL` | `info` | Pino log level |
| `CORS_ORIGIN` | `*` | Allowed origins: `*` or a comma-separated list. Set it in production. |
| `TRUST_PROXY` | `0` | Proxies in front of the app: a hop count, or their addresses and subnets. See [Behind a load balancer](#behind-a-load-balancer). |
<!-- @slot env -->

<!-- @slot sections -->
## Docker

```bash
# Build and run with Docker Compose
docker compose up --build

# Or build directly
docker build -t {{PROJECT_NAME}} .
docker run -p 3000:3000 {{PROJECT_NAME}}
```

## Behind a load balancer

Most hosting platforms, cloud load balancers and Kubernetes ingresses put a proxy in front of your app. Without `TRUST_PROXY`, `req.ip` is the proxy's address, so every client looks the same and rate limiting counts them all together.

Set `TRUST_PROXY=1` for one proxy, and add one for each extra proxy in front of it, such as a CDN. You can also list the proxies' addresses or subnets instead, for example `TRUST_PROXY=loopback,10.0.0.0/8`. `true` isn't accepted, because it would let any client choose its own IP by sending an `X-Forwarded-For` header.

## Tech Stack

- **Runtime**: Node.js 22.12+
- **Language**: TypeScript (strict mode)
- **Framework**: Express 5
- **Validation**: Zod
- **API Docs**: Swagger / OpenAPI 3.0
- **Testing**: Vitest + Supertest
- **Logging**: Pino
- **Linting**: ESLint + Prettier
- **Security**: Helmet + CORS
<!-- @slot tech-stack -->

## License

MIT
