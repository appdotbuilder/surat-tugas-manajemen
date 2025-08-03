
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type TaskLetter } from '../schema';
import { desc } from 'drizzle-orm';

export const getTaskLetters = async (): Promise<TaskLetter[]> => {
  try {
    const results = await db.select()
      .from(taskLettersTable)
      .orderBy(desc(taskLettersTable.created_at))
      .execute();

    // Convert numeric and date fields back to proper types
    return results.map(taskLetter => ({
      ...taskLetter,
      advance_money: parseFloat(taskLetter.advance_money),
      start_date: new Date(taskLetter.start_date),
      end_date: new Date(taskLetter.end_date),
      creation_date: new Date(taskLetter.creation_date),
      arrival_date: taskLetter.arrival_date ? new Date(taskLetter.arrival_date) : null,
      return_date: taskLetter.return_date ? new Date(taskLetter.return_date) : null
    }));
  } catch (error) {
    console.error('Failed to fetch task letters:', error);
    throw error;
  }
};
