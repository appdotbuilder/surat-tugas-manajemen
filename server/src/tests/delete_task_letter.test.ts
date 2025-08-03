
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type DeleteTaskLetterInput } from '../schema';
import { deleteTaskLetter } from '../handlers/delete_task_letter';
import { eq } from 'drizzle-orm';

describe('deleteTaskLetter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task letter successfully', async () => {
    // Create a task letter first
    const createdResult = await db.insert(taskLettersTable)
      .values({
        register_number: 'TL-2024-001',
        title: 'Business Trip to Jakarta',
        recipient_name: 'John Doe',
        recipient_position: 'Manager',
        destination_place: 'Jakarta',
        purpose: 'Client meeting and project discussion',
        start_date: '2024-01-15',
        end_date: '2024-01-20',
        transportation: 'Flight',
        advance_money: '5000000.00',
        signatory_name: 'Jane Smith',
        signatory_position: 'Director',
        creation_place: 'Bandung',
        creation_date: '2024-01-10'
      })
      .returning()
      .execute();

    const createdTaskLetter = createdResult[0];
    const deleteInput: DeleteTaskLetterInput = { id: createdTaskLetter.id };

    // Delete the task letter
    const result = await deleteTaskLetter(deleteInput);

    // Should return success
    expect(result.success).toBe(true);
  });

  it('should remove task letter from database', async () => {
    // Create a task letter first
    const createdResult = await db.insert(taskLettersTable)
      .values({
        register_number: 'TL-2024-001',
        title: 'Business Trip to Jakarta',
        recipient_name: 'John Doe',
        recipient_position: 'Manager',
        destination_place: 'Jakarta',
        purpose: 'Client meeting and project discussion',
        start_date: '2024-01-15',
        end_date: '2024-01-20',
        transportation: 'Flight',
        advance_money: '5000000.00',
        signatory_name: 'Jane Smith',
        signatory_position: 'Director',
        creation_place: 'Bandung',
        creation_date: '2024-01-10'
      })
      .returning()
      .execute();

    const createdTaskLetter = createdResult[0];
    const deleteInput: DeleteTaskLetterInput = { id: createdTaskLetter.id };

    // Delete the task letter
    await deleteTaskLetter(deleteInput);

    // Verify it's no longer in the database
    const taskLetters = await db.select()
      .from(taskLettersTable)
      .where(eq(taskLettersTable.id, createdTaskLetter.id))
      .execute();

    expect(taskLetters).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent task letter', async () => {
    const deleteInput: DeleteTaskLetterInput = { id: 999999 };

    // Try to delete non-existent task letter
    const result = await deleteTaskLetter(deleteInput);

    // Should return success false
    expect(result.success).toBe(false);
  });

  it('should not affect other task letters when deleting one', async () => {
    // Create two task letters
    const firstResult = await db.insert(taskLettersTable)
      .values({
        register_number: 'TL-2024-001',
        title: 'Business Trip to Jakarta',
        recipient_name: 'John Doe',
        recipient_position: 'Manager',
        destination_place: 'Jakarta',
        purpose: 'Client meeting and project discussion',
        start_date: '2024-01-15',
        end_date: '2024-01-20',
        transportation: 'Flight',
        advance_money: '5000000.00',
        signatory_name: 'Jane Smith',
        signatory_position: 'Director',
        creation_place: 'Bandung',
        creation_date: '2024-01-10'
      })
      .returning()
      .execute();

    const secondResult = await db.insert(taskLettersTable)
      .values({
        register_number: 'TL-2024-002',
        title: 'Business Trip to Jakarta',
        recipient_name: 'John Doe',
        recipient_position: 'Manager',
        destination_place: 'Jakarta',
        purpose: 'Client meeting and project discussion',
        start_date: '2024-01-15',
        end_date: '2024-01-20',
        transportation: 'Flight',
        advance_money: '5000000.00',
        signatory_name: 'Jane Smith',
        signatory_position: 'Director',
        creation_place: 'Bandung',
        creation_date: '2024-01-10'
      })
      .returning()
      .execute();

    const firstTaskLetter = firstResult[0];
    const secondTaskLetter = secondResult[0];

    // Delete only the first task letter
    const deleteInput: DeleteTaskLetterInput = { id: firstTaskLetter.id };
    await deleteTaskLetter(deleteInput);

    // Verify first task letter is deleted
    const firstCheck = await db.select()
      .from(taskLettersTable)
      .where(eq(taskLettersTable.id, firstTaskLetter.id))
      .execute();

    expect(firstCheck).toHaveLength(0);

    // Verify second task letter still exists
    const secondCheck = await db.select()
      .from(taskLettersTable)
      .where(eq(taskLettersTable.id, secondTaskLetter.id))
      .execute();

    expect(secondCheck).toHaveLength(1);
    expect(secondCheck[0].register_number).toEqual('TL-2024-002');
  });
});
