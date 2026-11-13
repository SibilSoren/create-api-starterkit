import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../src/app.js';
import { closeDb, db } from '../../../src/db/client.js';
import { users } from '../../../src/db/schema.js';
import { sampleUsers, seed } from '../../../src/db/seed.js';

// Use an in-memory Postgres instead of DATABASE_URL.
vi.mock('../../../src/db/client.js', () => import('../../helpers/test-db.js'));

const app = createApp();

beforeEach(async () => {
  await db.delete(users);
  await seed();
});

afterAll(async () => {
  await closeDb();
});

const emails = (list: Array<{ email: string }>) =>
  list.map((user) => user.email).sort();

describe('GET /api/users', () => {
  it('lists the seeded users', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(200);
    expect(emails(response.body.data)).toEqual(emails(sampleUsers));
  });
});

describe('GET /api/users/:id', () => {
  it('returns the user', async () => {
    const [first] = (await request(app).get('/api/users')).body.data;

    const response = await request(app).get(`/api/users/${first.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(first);
  });

  it('returns 404 for an id no user has', async () => {
    const response = await request(app).get(
      '/api/users/00000000-0000-4000-8000-000000000000',
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });

  it('returns 400 for an id that is not a UUID', async () => {
    const response = await request(app).get('/api/users/42');

    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe('id');
  });
});

describe('POST /api/users', () => {
  it('creates a user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Kiran Das', email: 'Kiran@Example.com' });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      name: 'Kiran Das',
      email: 'kiran@example.com',
    });
    expect(response.body.data.id).toEqual(expect.any(String));

    const list = await request(app).get('/api/users');
    expect(list.body.data).toHaveLength(sampleUsers.length + 1);
  });

  it('returns 409 for an email that is taken, in any case', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Someone', email: sampleUsers[0].email.toUpperCase() });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('A user with this email already exists');
  });

  it('returns 400 for a missing name or an invalid email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: '', email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.errors.map((e: { field: string }) => e.field)).toEqual(
      ['name', 'email'],
    );
  });
});
