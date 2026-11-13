import type { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import { ApiResponse } from '../../utils/api-response.js';
import { usersRepository } from './users.repository.js';
import type { CreateUserInput } from './users.schema.js';

/**
 * GET /api/users
 */
export async function listUsers(_req: Request, res: Response): Promise<void> {
  ApiResponse.success(res, await usersRepository.findAll());
}

/**
 * GET /api/users/:id
 */
export async function getUser(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const user = await usersRepository.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  ApiResponse.success(res, user);
}

/**
 * POST /api/users
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  // Already checked against createUserSchema by the validate middleware.
  const user = await usersRepository.create(req.body as CreateUserInput);
  if (!user) throw ApiError.conflict('A user with this email already exists');

  ApiResponse.created(res, user, 'User created');
}
