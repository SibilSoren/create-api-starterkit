import { fileURLToPath } from 'node:url';
import swaggerJsdoc from 'swagger-jsdoc';
import { appInfo } from './app-info.js';

// Read route docs relative to this file, so they're found in src/ during
// development and in dist/ (compiled .js, comments kept) in production.
const modulesDir = fileURLToPath(new URL('../modules', import.meta.url))
  // glob patterns need forward slashes, also on Windows
  .replaceAll('\\', '/');

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '{{PROJECT_NAME}} API',
      version: appInfo.version,
      description:
        'API documentation for {{PROJECT_NAME}}. Built with Express, TypeScript, and Zod.',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    // Relative, so "Try it out" calls whatever host is serving the docs.
    servers: [{ url: '/' }],
  },
  apis: [`${modulesDir}/**/*.routes.{ts,js}`],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
