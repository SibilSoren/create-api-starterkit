# Contributing to create-api-starterkit

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js >= 22.12
- npm or pnpm

### Setup

1. **Fork** the repository on GitHub
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/create-api-starterkit.git
   cd create-api-starterkit
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Test locally** by scaffolding a project:
   ```bash
   npx tsx src/index.ts test-project --skip-install
   ```

## Development Workflow

### Project Structure

```
create-api-starterkit/
├── src/              # CLI tool source code
│   ├── index.ts      # Entry point
│   ├── create.ts     # Core scaffolding logic
│   ├── types.ts      # Shared types
│   └── utils/        # Helper utilities
├── template/         # The API project template
│   ├── src/          # Template source files
│   └── ...           # Config files
└── ...
```

### Making Changes

**To the CLI tool** (`src/`):
- Modify the CLI logic, add flags, improve UX
- Test by running `npx tsx src/index.ts <project-name>`

**To the template** (`template/`):
- Modify the generated API project
- Test by scaffolding a new project and running it

### Code Style

- We use **ESLint** and **Prettier** for consistent code formatting
- Run `npm run lint` to check for issues
- Run `npm run format` to auto-format

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add --auth flag for JWT authentication
fix: resolve template path issue on Windows
docs: improve README with more examples
chore: update dependencies
```

## Pull Request Process

1. Create a **feature branch** from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```
2. Make your changes and **commit** with a clear message
3. **Push** to your fork and open a Pull Request
4. Fill out the **PR template**
5. Wait for review — we'll get back to you quickly!

## What to Contribute

### Good First Issues

Look for issues labeled `good first issue` on GitHub. These are specifically curated for new contributors.

### Ideas We'd Love

- New flags (e.g., `--db prisma`, `--auth jwt`, `--framework hono`)
- Template improvements (better error handling, new modules)
- Documentation improvements
- Bug fixes
- CI/CD improvements

### Before Opening a Large PR

If you're planning a significant change, **open an issue first** to discuss the approach. This helps avoid wasted effort and ensures alignment with the project direction.

## Reporting Bugs

Use the [Bug Report template](https://github.com/SibilSoren/create-api-starterkit/issues/new?template=bug_report.md) on GitHub. Include:

- Your Node.js version
- Your OS
- Steps to reproduce
- Expected vs actual behavior

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this standard.

---

Thank you for making `create-api-starterkit` better! 🚀
