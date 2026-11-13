import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';

/**
 * Every database query for users. The controller only calls these
 * functions, so nothing else in the module depends on Drizzle.
 */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const usersRepository = {
  async findAll(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .orderBy(asc(users.createdAt), asc(users.email));
  },

  async findById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  /**
   * Insert a user. Returns undefined when the email is already taken.
   */
  async create(data: NewUser): Promise<User | undefined> {
    try {
      const [user] = await db.insert(users).values(data).returning();
      return user;
    } catch (error) {
      if (isUniqueViolation(error)) return undefined;
      throw error;
    }
  },
};

// Postgres reports a duplicate value in a unique column as error 23505.
// Drizzle can wrap the driver's error, so the cause is checked too.
function isUniqueViolation(error: unknown): boolean {
  const code = (value: unknown) =>
    typeof value === 'object' && value !== null && 'code' in value
      ? value.code
      : undefined;
  return (
    code(error) === '23505' ||
    (error instanceof Error && code(error.cause) === '23505')
  );
}
