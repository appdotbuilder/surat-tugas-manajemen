
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type CreateTaskLetterInput, type TaskLetter } from '../schema';
import { eq } from 'drizzle-orm';

export const createTaskLetter = async (input: CreateTaskLetterInput): Promise<TaskLetter> => {
  try {
    // Validate that end_date is after start_date
    if (input.end_date <= input.start_date) {
      throw new Error('End date must be after start date');
    }

    // Check if register_number is unique
    const existingTaskLetter = await db.select()
      .from(taskLettersTable)
      .where(eq(taskLettersTable.register_number, input.register_number))
      .execute();

    if (existingTaskLetter.length > 0) {
      throw new Error('Register number already exists');
    }

    // Insert task letter record
    const result = await db.insert(taskLettersTable)
      .values({
        register_number: input.register_number,
        title: input.title,
        recipient_name: input.recipient_name,
        recipient_position: input.recipient_position,
        destination_place: input.destination_place,
        purpose: input.purpose,
        start_date: input.start_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        end_date: input.end_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        transportation: input.transportation,
        advance_money: input.advance_money.toString(), // Convert number to string for numeric column
        signatory_name: input.signatory_name,
        signatory_position: input.signatory_position,
        creation_place: input.creation_place,
        creation_date: input.creation_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        arrival_date: null, // Initially null, to be filled by destination official
        return_date: null, // Initially null, to be filled by destination official
        ticket_taken: null, // Initially null, to be filled by destination official
        official_notes: null // Initially null, to be filled by destination official
      })
      .returning()
      .execute();

    // Convert numeric and date fields back to proper types before returning
    const taskLetter = result[0];
    return {
      ...taskLetter,
      advance_money: parseFloat(taskLetter.advance_money), // Convert string back to number
      start_date: new Date(taskLetter.start_date), // Convert string back to Date
      end_date: new Date(taskLetter.end_date), // Convert string back to Date
      creation_date: new Date(taskLetter.creation_date), // Convert string back to Date
      arrival_date: taskLetter.arrival_date ? new Date(taskLetter.arrival_date) : null,
      return_date: taskLetter.return_date ? new Date(taskLetter.return_date) : null
    };
  } catch (error) {
    console.error('Task letter creation failed:', error);
    throw error;
  }
};
