
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type GetTaskLetterByIdInput, type CreateTaskLetterInput } from '../schema';
import { getTaskLetterById } from '../handlers/get_task_letter_by_id';

// Test input for creating a task letter
const testTaskLetterInput: CreateTaskLetterInput = {
  register_number: 'TL-2024-001',
  title: 'Business Trip to Jakarta',
  recipient_name: 'John Doe',
  recipient_position: 'Manager',
  destination_place: 'Jakarta',
  purpose: 'Client meeting and contract negotiation',
  start_date: new Date('2024-01-15'),
  end_date: new Date('2024-01-17'),
  transportation: 'Flight',
  advance_money: 1500000,
  signatory_name: 'Jane Smith',
  signatory_position: 'Director',
  creation_place: 'Surabaya',
  creation_date: new Date('2024-01-10')
};

describe('getTaskLetterById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get task letter by id', async () => {
    // Create a task letter first - convert types for database insert
    const insertResult = await db.insert(taskLettersTable)
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

    const createdTaskLetter = insertResult[0];
    const input: GetTaskLetterByIdInput = { id: createdTaskLetter.id };

    const result = await getTaskLetterById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTaskLetter.id);
    expect(result!.register_number).toEqual('TL-2024-001');
    expect(result!.title).toEqual('Business Trip to Jakarta');
    expect(result!.recipient_name).toEqual('John Doe');
    expect(result!.recipient_position).toEqual('Manager');
    expect(result!.destination_place).toEqual('Jakarta');
    expect(result!.purpose).toEqual('Client meeting and contract negotiation');
    expect(result!.start_date).toEqual(new Date('2024-01-15'));
    expect(result!.end_date).toEqual(new Date('2024-01-17'));
    expect(result!.transportation).toEqual('Flight');
    expect(result!.advance_money).toEqual(1500000);
    expect(typeof result!.advance_money).toEqual('number');
    expect(result!.signatory_name).toEqual('Jane Smith');
    expect(result!.signatory_position).toEqual('Director');
    expect(result!.creation_place).toEqual('Surabaya');
    expect(result!.creation_date).toEqual(new Date('2024-01-10'));
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent task letter', async () => {
    const input: GetTaskLetterByIdInput = { id: 999 };

    const result = await getTaskLetterById(input);

    expect(result).toBeNull();
  });

  it('should handle nullable fields correctly', async () => {
    // Create a task letter with some nullable fields filled
    const insertResult = await db.insert(taskLettersTable)
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
        creation_date: testTaskLetterInput.creation_date.toISOString().split('T')[0],
        arrival_date: '2024-01-15',
        return_date: '2024-01-17',
        ticket_taken: true,
        official_notes: 'Trip completed successfully'
      })
      .returning()
      .execute();

    const createdTaskLetter = insertResult[0];
    const input: GetTaskLetterByIdInput = { id: createdTaskLetter.id };

    const result = await getTaskLetterById(input);

    expect(result).not.toBeNull();
    expect(result!.arrival_date).toEqual(new Date('2024-01-15'));
    expect(result!.return_date).toEqual(new Date('2024-01-17'));
    expect(result!.ticket_taken).toEqual(true);
    expect(result!.official_notes).toEqual('Trip completed successfully');
  });
});
