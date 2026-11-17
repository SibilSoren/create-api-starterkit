import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Database tables. After changing them, run `npm run db:generate` to write a
 * migration into drizzle/, then `npm run db:migrate` to apply it.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
