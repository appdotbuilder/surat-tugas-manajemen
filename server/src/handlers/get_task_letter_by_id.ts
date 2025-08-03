
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type GetTaskLetterByIdInput, type TaskLetter } from '../schema';
import { eq } from 'drizzle-orm';

export const getTaskLetterById = async (input: GetTaskLetterByIdInput): Promise<TaskLetter | null> => {
  try {
    // Query task letter by ID
    const results = await db.select()
      .from(taskLettersTable)
      .where(eq(taskLettersTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert fields to match the Zod schema types
    const taskLetter = results[0];
    return {
      ...taskLetter,
      advance_money: parseFloat(taskLetter.advance_money), // Convert string to number
      start_date: new Date(taskLetter.start_date), // Convert string to Date
      end_date: new Date(taskLetter.end_date), // Convert string to Date
      creation_date: new Date(taskLetter.creation_date), // Convert string to Date
      arrival_date: taskLetter.arrival_date ? new Date(taskLetter.arrival_date) : null, // Convert string to Date or null
      return_date: taskLetter.return_date ? new Date(taskLetter.return_date) : null // Convert string to Date or null
    };
  } catch (error) {
    console.error('Failed to get task letter by ID:', error);
    throw error;
  }
};
