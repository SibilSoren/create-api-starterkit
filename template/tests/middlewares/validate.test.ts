import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validate } from '../../src/middlewares/validate.js';
import { errorHandler } from '../../src/middlewares/error-handler.js';

const app = express();
app.use(express.json());
app.get(
  '/items',
  validate(z.object({ page: z.coerce.number().int().positive() }), 'query'),
  (req, res) => {
    res.json({ page: req.query.page, type: typeof req.query.page });
  },
);
app.post(
  '/items',
  validate(z.object({ name: z.string().min(1), email: z.email() })),
  (req, res) => {
    res.status(201).json(req.body);
  },
);
app.use(errorHandler);

describe('validate middleware', () => {
  it('replaces req.query with the parsed values', async () => {
    const response = await request(app).get('/items?page=2');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ page: 2, type: 'number' });
  });

  it('returns 400 with the failing query fields', async () => {
    const response = await request(app).get('/items?page=zero');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors[0].field).toBe('page');
  });

  it('passes a valid body through', async () => {
    const response = await request(app)
      .post('/items')
      .send({ name: 'Asha', email: 'asha@example.com' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ name: 'Asha', email: 'asha@example.com' });
  });

  it('returns 400 with every failing body field', async () => {
    const response = await request(app)
      .post('/items')
      .send({ name: '', email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.errors.map((e: { field: string }) => e.field)).toEqual(
      ['name', 'email'],
    );
  });
});
