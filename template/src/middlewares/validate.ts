import type { Request, Response, NextFunction } from 'express';
import type { ZodError, ZodType } from 'zod';
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
  schema: ZodType,
  source: 'body' | 'query' | 'params' = 'body',
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      ApiResponse.error(res, 'Validation failed', 400, errors);
      return;
    }

    // Replace the original data with the parsed/transformed data.
    // Express 5 makes req.query a getter, so it can't be assigned directly.
    Object.defineProperty(req, source, {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });
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
    field: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}
