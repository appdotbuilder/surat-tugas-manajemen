
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type UpdateTaskLetterInput, type TaskLetter } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const updateTaskLetter = async (input: UpdateTaskLetterInput): Promise<TaskLetter> => {
  try {
    const { id, ...updateFields } = input;

    // Check if task letter exists
    const existingTaskLetter = await db.select()
      .from(taskLettersTable)
      .where(eq(taskLettersTable.id, id))
      .execute();

    if (existingTaskLetter.length === 0) {
      throw new Error('Task letter not found');
    }

    // If register_number is being updated, check uniqueness
    if (updateFields.register_number) {
      const duplicateCheck = await db.select()
        .from(taskLettersTable)
        .where(
          and(
            eq(taskLettersTable.register_number, updateFields.register_number),
            ne(taskLettersTable.id, id)
          )
        )
        .execute();

      if (duplicateCheck.length > 0) {
        throw new Error('Register number already exists');
      }
    }

    const current = existingTaskLetter[0];
    
    // Validate date logic if both dates are being updated
    if (updateFields.start_date && updateFields.end_date) {
      if (updateFields.end_date <= updateFields.start_date) {
        throw new Error('End date must be after start date');
      }
    }
    // If only one date is being updated, check against existing date
    else if (updateFields.start_date) {
      // Convert current.end_date string to Date for comparison
      const currentEndDate = new Date(current.end_date);
      if (updateFields.start_date >= currentEndDate) {
        throw new Error('Start date must be before end date');
      }
    }
    else if (updateFields.end_date) {
      // Convert current.start_date string to Date for comparison
      const currentStartDate = new Date(current.start_date);
      if (updateFields.end_date <= currentStartDate) {
        throw new Error('End date must be after start date');
      }
    }

    // Prepare update data with numeric conversion and updated_at timestamp
    const updateData: any = {
      ...updateFields,
      updated_at: new Date()
    };

    // Convert advance_money to string if present
    if (updateFields.advance_money !== undefined) {
      updateData.advance_money = updateFields.advance_money.toString();
    }

    // Update the task letter
    const result = await db.update(taskLettersTable)
      .set(updateData)
      .where(eq(taskLettersTable.id, id))
      .returning()
      .execute();

    // Convert fields back to proper types before returning
    const updatedTaskLetter = result[0];
    return {
      ...updatedTaskLetter,
      advance_money: parseFloat(updatedTaskLetter.advance_money),
      start_date: new Date(updatedTaskLetter.start_date),
      end_date: new Date(updatedTaskLetter.end_date),
      creation_date: new Date(updatedTaskLetter.creation_date),
      arrival_date: updatedTaskLetter.arrival_date ? new Date(updatedTaskLetter.arrival_date) : null,
      return_date: updatedTaskLetter.return_date ? new Date(updatedTaskLetter.return_date) : null
    };
  } catch (error) {
    console.error('Task letter update failed:', error);
    throw error;
  }
};
