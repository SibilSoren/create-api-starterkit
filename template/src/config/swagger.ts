import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '{{PROJECT_NAME}} API',
      version: '1.0.0',
      description:
        'API documentation for {{PROJECT_NAME}}. Built with Express, TypeScript, and Zod.',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
