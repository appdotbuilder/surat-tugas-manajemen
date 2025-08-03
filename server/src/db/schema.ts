
import { serial, text, pgTable, timestamp, numeric, boolean, date } from 'drizzle-orm/pg-core';

export const taskLettersTable = pgTable('task_letters', {
  id: serial('id').primaryKey(),
  register_number: text('register_number').notNull().unique(),
  title: text('title').notNull(),
  recipient_name: text('recipient_name').notNull(),
  recipient_position: text('recipient_position').notNull(),
  destination_place: text('destination_place').notNull(),
  purpose: text('purpose').notNull(),
  start_date: date('start_date').notNull(),
  end_date: date('end_date').notNull(),
  transportation: text('transportation').notNull(),
  advance_money: numeric('advance_money', { precision: 12, scale: 2 }).notNull(),
  signatory_name: text('signatory_name').notNull(),
  signatory_position: text('signatory_position').notNull(),
  creation_place: text('creation_place').notNull(),
  creation_date: date('creation_date').notNull(),
  arrival_date: date('arrival_date'), // Nullable - filled by official at destination
  return_date: date('return_date'), // Nullable - filled by official at destination
  ticket_taken: boolean('ticket_taken'), // Nullable - filled by official at destination
  official_notes: text('official_notes'), // Nullable - additional notes from official
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type TaskLetter = typeof taskLettersTable.$inferSelect; // For SELECT operations
export type NewTaskLetter = typeof taskLettersTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { taskLetters: taskLettersTable };
