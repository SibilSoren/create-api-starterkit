import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { createUser, getUser, listUsers } from './users.controller.js';
import { createUserSchema, userParamsSchema } from './users.schema.js';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: Asha Rao
 *         email:
 *           type: string
 *           format: email
 *           example: asha@example.com
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List users
 *     responses:
 *       200:
 *         description: All users, oldest first
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Asha Rao
 *               email:
 *                 type: string
 *                 format: email
 *                 example: asha@example.com
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: The name or email is missing or invalid
 *       409:
 *         description: A user with this email already exists
 */
router.get('/', listUsers);
router.post('/', validate(createUserSchema), createUser);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: The id isn't a UUID
 *       404:
 *         description: No user has this id
 */
router.get('/:id', validate(userParamsSchema, 'params'), getUser);

export { router as userRoutes };
