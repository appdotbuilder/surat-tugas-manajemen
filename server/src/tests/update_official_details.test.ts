
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type UpdateOfficialDetailsInput, type CreateTaskLetterInput } from '../schema';
import { updateOfficialDetails } from '../handlers/update_official_details';
import { eq } from 'drizzle-orm';

// Test input for creating a task letter first
const testTaskLetterInput: CreateTaskLetterInput = {
  register_number: 'TL-001-2024',
  title: 'Business Meeting',
  recipient_name: 'John Doe',
  recipient_position: 'Manager',
  destination_place: 'Jakarta',
  purpose: 'Project discussion',
  start_date: new Date('2024-01-15'),
  end_date: new Date('2024-01-17'),
  transportation: 'Flight',
  advance_money: 1500000,
  signatory_name: 'Jane Smith',
  signatory_position: 'Director',
  creation_place: 'Bandung',
  creation_date: new Date('2024-01-10')
};

// Test input for updating official details - using date-only dates for consistency
const testOfficialDetailsInput: UpdateOfficialDetailsInput = {
  id: 1, // Will be updated with actual ID
  arrival_date: new Date('2024-01-15'), // Date-only format for consistency
  return_date: new Date('2024-01-17'), // Date-only format for consistency
  ticket_taken: true,
  official_notes: 'Meeting completed successfully. All objectives achieved.'
};

describe('updateOfficialDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update official details of existing task letter', async () => {
    // Create a task letter first - convert types for database insertion
    const createResult = await db.insert(taskLettersTable)
      .values({
        register_number: testTaskLetterInput.register_number,
        title: testTaskLetterInput.title,
        recipient_name: testTaskLetterInput.recipient_name,
        recipient_position: testTaskLetterInput.recipient_position,
        destination_place: testTaskLetterInput.destination_place,
        purpose: testTaskLetterInput.purpose,
        start_date: testTaskLetterInput.start_date.toISOString().split('T')[0], // Convert Date to string
        end_date: testTaskLetterInput.end_date.toISOString().split('T')[0], // Convert Date to string
        transportation: testTaskLetterInput.transportation,
        advance_money: testTaskLetterInput.advance_money.toString(), // Convert number to string
        signatory_name: testTaskLetterInput.signatory_name,
        signatory_position: testTaskLetterInput.signatory_position,
        creation_place: testTaskLetterInput.creation_place,
        creation_date: testTaskLetterInput.creation_date.toISOString().split('T')[0] // Convert Date to string
      })
      .returning()
      .execute();

    const taskLetterId = createResult[0].id;
    const updateInput = { ...testOfficialDetailsInput, id: taskLetterId };

    // Update official details
    const result = await updateOfficialDetails(updateInput);

    // Verify all fields are updated correctly - expect date-only format
    expect(result.id).toEqual(taskLetterId);
    expect(result.arrival_date).toEqual(new Date('2024-01-15T00:00:00.000Z'));
    expect(result.return_date).toEqual(new Date('2024-01-17T00:00:00.000Z'));
    expect(result.ticket_taken).toEqual(true);
    expect(result.official_notes).toEqual('Meeting completed successfully. All objectives achieved.');
    expect(typeof result.advance_money).toBe('number');
    expect(result.advance_money).toEqual(1500000);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated details to database', async () => {
    // Create a task letter first
    const createResult = await db.insert(taskLettersTable)
      .values({
        register_number: testTaskLetterInput.register_number,
        title: testTaskLetterInput.title,
        recipient_name: testTaskLetterInput.recipient_name,
        recipient_position: testTaskLetterInput.recipient_position,
        destination_place: testTaskLetterInput.destination_place,
        purpose: testTaskLetterInput.purpose,
        start_date: testTaskLetterInput.start_date.toISOString().split('T')[0],
        end_date: testTaskLetterInput.end_date.toISOString().split('T')[0],
        transportation: testTaskLetterInput.transportation,
        advance_money: testTaskLetterInput.advance_money.toString(),
        signatory_name: testTaskLetterInput.signatory_name,
        signatory_position: testTaskLetterInput.signatory_position,
        creation_place: testTaskLetterInput.creation_place,
        creation_date: testTaskLetterInput.creation_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const taskLetterId = createResult[0].id;
    const updateInput = { ...testOfficialDetailsInput, id: taskLetterId };

    // Update official details
    await updateOfficialDetails(updateInput);

    // Verify changes are persisted in database
    const savedTaskLetters = await db.select()
      .from(taskLettersTable)
      .where(eq(taskLettersTable.id, taskLetterId))
      .execute();

    expect(savedTaskLetters).toHaveLength(1);
    const savedTaskLetter = savedTaskLetters[0];
    
    // Safe null checking for date conversion
    const expectedArrivalDate = testOfficialDetailsInput.arrival_date 
      ? testOfficialDetailsInput.arrival_date.toISOString().split('T')[0]
      : null;
    const expectedReturnDate = testOfficialDetailsInput.return_date
      ? testOfficialDetailsInput.return_date.toISOString().split('T')[0] 
      : null;
      
    expect(savedTaskLetter.arrival_date).toEqual(expectedArrivalDate);
    expect(savedTaskLetter.return_date).toEqual(expectedReturnDate);
    expect(savedTaskLetter.ticket_taken).toEqual(true);
    expect(savedTaskLetter.official_notes).toEqual('Meeting completed successfully. All objectives achieved.');
    expect(savedTaskLetter.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields and leave others unchanged', async () => {
    // Create a task letter first
    const createResult = await db.insert(taskLettersTable)
      .values({
        register_number: testTaskLetterInput.register_number,
        title: testTaskLetterInput.title,
        recipient_name: testTaskLetterInput.recipient_name,
        recipient_position: testTaskLetterInput.recipient_position,
        destination_place: testTaskLetterInput.destination_place,
        purpose: testTaskLetterInput.purpose,
        start_date: testTaskLetterInput.start_date.toISOString().split('T')[0],
        end_date: testTaskLetterInput.end_date.toISOString().split('T')[0],
        transportation: testTaskLetterInput.transportation,
        advance_money: testTaskLetterInput.advance_money.toString(),
        signatory_name: testTaskLetterInput.signatory_name,
        signatory_position: testTaskLetterInput.signatory_position,
        creation_place: testTaskLetterInput.creation_place,
        creation_date: testTaskLetterInput.creation_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const taskLetterId = createResult[0].id;
    
    // Update with partial data (only arrival_date and official_notes)
    const partialUpdate: UpdateOfficialDetailsInput = {
      id: taskLetterId,
      arrival_date: new Date('2024-01-15'), // Use date-only format
      return_date: null,
      ticket_taken: null,
      official_notes: 'Arrived on time'
    };

    const result = await updateOfficialDetails(partialUpdate);

    // Verify only updated fields changed, others remain as they were
    expect(result.arrival_date).toEqual(new Date('2024-01-15T00:00:00.000Z'));
    expect(result.return_date).toBeNull();
    expect(result.ticket_taken).toBeNull(); 
    expect(result.official_notes).toEqual('Arrived on time');
    expect(result.title).toEqual('Business Meeting'); // Original field unchanged
    expect(result.recipient_name).toEqual('John Doe'); // Original field unchanged
  });

  it('should throw error when task letter not found', async () => {
    const nonExistentInput: UpdateOfficialDetailsInput = {
      id: 999,
      arrival_date: new Date(),
      return_date: new Date(),
      ticket_taken: true,
      official_notes: 'Test notes'
    };

    await expect(updateOfficialDetails(nonExistentInput))
      .rejects.toThrow(/Task letter with id 999 not found/i);
  });

  it('should handle null values correctly', async () => {
    // Create a task letter first
    const createResult = await db.insert(taskLettersTable)
      .values({
        register_number: testTaskLetterInput.register_number,
        title: testTaskLetterInput.title,
        recipient_name: testTaskLetterInput.recipient_name,
        recipient_position: testTaskLetterInput.recipient_position,
        destination_place: testTaskLetterInput.destination_place,
        purpose: testTaskLetterInput.purpose,
        start_date: testTaskLetterInput.start_date.toISOString().split('T')[0],
        end_date: testTaskLetterInput.end_date.toISOString().split('T')[0],
        transportation: testTaskLetterInput.transportation,
        advance_money: testTaskLetterInput.advance_money.toString(),
        signatory_name: testTaskLetterInput.signatory_name,
        signatory_position: testTaskLetterInput.signatory_position,
        creation_place: testTaskLetterInput.creation_place,
        creation_date: testTaskLetterInput.creation_date.toISOString().split('T')[0]
      })
      .returning()
      .execute();

    const taskLetterId = createResult[0].id;
    
    // Update with all null values
    const nullUpdate: UpdateOfficialDetailsInput = {
      id: taskLetterId,
      arrival_date: null,
      return_date: null,
      ticket_taken: null,
      official_notes: null
    };

    const result = await updateOfficialDetails(nullUpdate);

    // Verify null values are set correctly
    expect(result.arrival_date).toBeNull();
    expect(result.return_date).toBeNull();
    expect(result.ticket_taken).toBeNull();
    expect(result.official_notes).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
