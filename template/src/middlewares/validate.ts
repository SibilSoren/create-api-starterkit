import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema, type ZodError } from 'zod';
import { ApiResponse } from '../utils/api-response.js';

/**
 * Validation middleware factory.
 * Validates request body, query, or params against a Zod schema.
 *
 * Usage:
 *   router.post('/users', validate(createUserSchema, 'body'), createUser);
 *   router.get('/users', validate(listUsersQuerySchema, 'query'), listUsers);
 */
export function validate(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body',
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      ApiResponse.error(res, 'Validation failed', 400, errors);
      return;
    }

    // Replace the original data with the parsed/transformed data
    req[source] = result.data;
    next();
  };
}

/**
 * Format Zod validation errors into a user-friendly structure.
 */
function formatZodErrors(
  error: ZodError,
): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}
