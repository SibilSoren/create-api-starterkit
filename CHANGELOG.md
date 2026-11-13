# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Options such as Gatekeeper add their code through named slots in the template, each described in one file, instead of find-and-replace on exact lines. Generated projects are byte-for-byte the same. "Adding an Option" in CONTRIBUTING.md explains how it works.

## [1.1.1] - 2026-11-13

### Fixed

- Rate limiting works behind a load balancer. Generated apps trusted no proxy, so every client had the load balancer's IP and they all shared one limit. Set the new `TRUST_PROXY` variable to the number of proxies in front of the app (usually `1`) or to their addresses. `true` is refused, because it would let clients choose their own IP.
- The health check is never rate limited, so load balancers can reach it even when clients are over the limit. Gatekeeper now comes right after it.
- In production, a non-operational `ApiError`, such as `ApiError.internal()`, sends only the status text instead of its message, which could hold internal details.
- `npm run typecheck` checks the tests too. The build now uses `tsconfig.build.json`.
- `PORT` must be a whole number from 1 to 65535.

## [1.1.0] - 2026-11-09

### Added

- Interactive setup: project name, Gatekeeper rate limiting and package manager. `--yes` takes the defaults, any option passed on the command line isn't asked, and it never asks in CI.
- Optional rate limiting with [Gatekeeper](https://github.com/SibilSoren/gatekeeper) 2: 100 requests a minute per IP, added by default. `--gatekeeper` / `--no-gatekeeper` choose without asking.

### Fixed

- Generated projects build again. `npm run build` failed with TypeScript errors on a fresh project, and so did the Docker image.
- The Dockerfile's production stage no longer fails on husky's `prepare` script.
- Swagger lists your routes in production. It read `src/`, which doesn't exist in a build.
- `validate(schema, 'query')` works on Express 5 instead of returning a 500.
- Malformed JSON returns 400 and an oversized body 413, instead of 500.
- pnpm installs work on pnpm 10 and later, which block dependency build scripts by default. The Dockerfile and README use pnpm when you pick it.
- The pre-commit hook actually runs. husky was installed, but there was no hook.
- The initial commit includes the lockfile.
- `test:coverage` works (missing `@vitest/coverage-v8`), and a fresh project passes `format:check`.
- A failed install shows the package manager's error instead of only "Failed to install dependencies".
- Next steps show the right commands for the package manager you picked.

### Changed

- Template dependencies updated: Zod 4 (fixes a high-severity advisory), Express 5.3, Pino 10, pino-http 11, ESLint 10, Vitest 5, TypeScript 6.0.
- `.env` is loaded with Node's built-in `process.loadEnvFile()`; dotenv is no longer a dependency.
- Node.js 22.12 or later is required, for the CLI and generated projects. Node 20 reached end of life in April 2026. Docker images use Node 24.
- `/api/health` leaves out memory usage and the environment in production, and reports the version from `package.json`.
- Request logs are one line per request instead of every header, and the Swagger UI's assets aren't logged.
- The JSON body limit is 1 MB instead of 10 MB.
- `CORS_ORIGIN` accepts a comma-separated list, and the server warns at startup when production allows every origin.
- `--package-manager` accepts `npm` or `pnpm` and rejects anything else.

### Added

- `typecheck` script, `.dockerignore`, `.nvmrc` and tests for validation, error handling and Swagger in generated projects.
- CI scaffolds a project with npm and pnpm on Node 22, 24 and 26, with and without Gatekeeper, then builds, tests, lints, boots the production build and builds the Docker image. It also runs weekly to catch dependency changes.
- CLI tests that scaffold every combination of options and check the generated files, so a new option can't change what the others produce.

## [1.0.0] - 2026-06-09

### Added

- Initial release
- CLI tool to scaffold Node.js + TypeScript + Express APIs
- Zero-config, zero-prompt scaffolding experience
- Template with Express 5, Zod validation, Swagger docs, Pino logging
- Health check module as example pattern
- Vitest + Supertest testing setup
- ESLint flat config + Prettier
- Docker support (Dockerfile + docker-compose)
- Git initialization with initial commit
- `--skip-install` flag to skip dependency installation
- `--no-git` flag to skip git initialization
- `--package-manager` flag to choose npm or pnpm
