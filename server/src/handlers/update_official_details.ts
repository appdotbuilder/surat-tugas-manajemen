
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type UpdateOfficialDetailsInput, type TaskLetter } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateOfficialDetails(input: UpdateOfficialDetailsInput): Promise<TaskLetter> {
  try {
    // Convert Date objects to ISO date strings for date columns
    const updateData = {
      arrival_date: input.arrival_date ? input.arrival_date.toISOString().split('T')[0] : null,
      return_date: input.return_date ? input.return_date.toISOString().split('T')[0] : null,
      ticket_taken: input.ticket_taken,
      official_notes: input.official_notes,
      updated_at: new Date() // timestamp column accepts Date objects
    };

    // Update the task letter with official details
    const result = await db.update(taskLettersTable)
      .set(updateData)
      .where(eq(taskLettersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Task letter with id ${input.id} not found`);
    }

    // Convert database result back to proper types
    const taskLetter = result[0];
    return {
      ...taskLetter,
      advance_money: parseFloat(taskLetter.advance_money), // Convert numeric to number
      start_date: new Date(taskLetter.start_date + 'T00:00:00.000Z'), // Convert date string to Date with UTC timezone
      end_date: new Date(taskLetter.end_date + 'T00:00:00.000Z'), // Convert date string to Date with UTC timezone
      creation_date: new Date(taskLetter.creation_date + 'T00:00:00.000Z'), // Convert date string to Date with UTC timezone
      arrival_date: taskLetter.arrival_date ? new Date(taskLetter.arrival_date + 'T00:00:00.000Z') : null,
      return_date: taskLetter.return_date ? new Date(taskLetter.return_date + 'T00:00:00.000Z') : null
    };
  } catch (error) {
    console.error('Official details update failed:', error);
    throw error;
  }
}
