import { z } from 'zod';

/**
 * Request schemas for the users module.
 */
export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  // Stored in lowercase, so the same address can't be registered twice.
  email: z.email().transform((email) => email.toLowerCase()),
});

export const userParamsSchema = z.object({
  id: z.uuid(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
