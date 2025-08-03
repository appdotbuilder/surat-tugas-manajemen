
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type DeleteTaskLetterInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTaskLetter = async (input: DeleteTaskLetterInput): Promise<{ success: boolean }> => {
  try {
    // Delete the task letter by ID
    const result = await db.delete(taskLettersTable)
      .where(eq(taskLettersTable.id, input.id))
      .execute();

    // Check if any rows were affected (deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Task letter deletion failed:', error);
    throw error;
  }
};
