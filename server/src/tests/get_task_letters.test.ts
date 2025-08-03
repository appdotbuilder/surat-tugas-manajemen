
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type CreateTaskLetterInput } from '../schema';
import { getTaskLetters } from '../handlers/get_task_letters';

// Test data for creating task letters
const testTaskLetter1: CreateTaskLetterInput = {
  register_number: 'TL-001',
  title: 'Official Business Trip',
  recipient_name: 'John Doe',
  recipient_position: 'Manager',
  destination_place: 'Jakarta',
  purpose: 'Meeting with clients',
  start_date: new Date('2024-01-15'),
  end_date: new Date('2024-01-20'),
  transportation: 'Flight',
  advance_money: 1500.50,
  signatory_name: 'Jane Smith',
  signatory_position: 'Director',
  creation_place: 'Bandung',
  creation_date: new Date('2024-01-10')
};

const testTaskLetter2: CreateTaskLetterInput = {
  register_number: 'TL-002',
  title: 'Training Workshop',
  recipient_name: 'Alice Johnson',
  recipient_position: 'Staff',
  destination_place: 'Surabaya',
  purpose: 'Technical training attendance',
  start_date: new Date('2024-02-01'),
  end_date: new Date('2024-02-03'),
  transportation: 'Train',
  advance_money: 800.75,
  signatory_name: 'Bob Wilson',
  signatory_position: 'Head of Department',
  creation_place: 'Bandung',
  creation_date: new Date('2024-01-25')
};

// Helper function to convert input data to database format
const formatForDatabase = (input: CreateTaskLetterInput) => ({
  ...input,
  start_date: input.start_date.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
  end_date: input.end_date.toISOString().split('T')[0],
  creation_date: input.creation_date.toISOString().split('T')[0],
  advance_money: input.advance_money.toString()
});

describe('getTaskLetters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no task letters exist', async () => {
    const result = await getTaskLetters();

    expect(result).toEqual([]);
  });

  it('should return all task letters', async () => {
    // Create test task letters
    await db.insert(taskLettersTable)
      .values([
        formatForDatabase(testTaskLetter1),
        formatForDatabase(testTaskLetter2)
      ])
      .execute();

    const result = await getTaskLetters();

    expect(result).toHaveLength(2);
    
    // Verify first task letter fields
    const firstTaskLetter = result.find(tl => tl.register_number === 'TL-001');
    expect(firstTaskLetter).toBeDefined();
    expect(firstTaskLetter!.title).toEqual('Official Business Trip');
    expect(firstTaskLetter!.recipient_name).toEqual('John Doe');
    expect(firstTaskLetter!.destination_place).toEqual('Jakarta');
    expect(firstTaskLetter!.advance_money).toEqual(1500.50);
    expect(typeof firstTaskLetter!.advance_money).toBe('number');
    expect(firstTaskLetter!.start_date).toBeInstanceOf(Date);
    expect(firstTaskLetter!.end_date).toBeInstanceOf(Date);
    expect(firstTaskLetter!.creation_date).toBeInstanceOf(Date);
    expect(firstTaskLetter!.created_at).toBeInstanceOf(Date);

    // Verify second task letter fields
    const secondTaskLetter = result.find(tl => tl.register_number === 'TL-002');
    expect(secondTaskLetter).toBeDefined();
    expect(secondTaskLetter!.title).toEqual('Training Workshop');
    expect(secondTaskLetter!.advance_money).toEqual(800.75);
    expect(typeof secondTaskLetter!.advance_money).toBe('number');
    expect(secondTaskLetter!.start_date).toBeInstanceOf(Date);
    expect(secondTaskLetter!.end_date).toBeInstanceOf(Date);
    expect(secondTaskLetter!.creation_date).toBeInstanceOf(Date);
  });

  it('should return task letters ordered by creation date (newest first)', async () => {
    // Create task letters with different creation times
    await db.insert(taskLettersTable)
      .values(formatForDatabase(testTaskLetter1))
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(taskLettersTable)
      .values(formatForDatabase(testTaskLetter2))
      .execute();

    const result = await getTaskLetters();

    expect(result).toHaveLength(2);
    
    // Verify ordering - newer task letter should be first
    expect(result[0].register_number).toEqual('TL-002');
    expect(result[1].register_number).toEqual('TL-001');
    
    // Verify timestamps are properly ordered
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle nullable fields correctly', async () => {
    // Create task letter with some nullable fields set
    await db.insert(taskLettersTable)
      .values({
        ...formatForDatabase(testTaskLetter1),
        arrival_date: '2024-01-16',
        return_date: '2024-01-19',
        ticket_taken: true,
        official_notes: 'Trip completed successfully'
      })
      .execute();

    const result = await getTaskLetters();

    expect(result).toHaveLength(1);
    const taskLetter = result[0];
    
    expect(taskLetter.arrival_date).toBeInstanceOf(Date);
    expect(taskLetter.arrival_date).toEqual(new Date('2024-01-16'));
    expect(taskLetter.return_date).toBeInstanceOf(Date);
    expect(taskLetter.return_date).toEqual(new Date('2024-01-19'));
    expect(taskLetter.ticket_taken).toBe(true);
    expect(taskLetter.official_notes).toEqual('Trip completed successfully');
  });

  it('should handle null nullable fields correctly', async () => {
    // Create task letter with nullable fields as null
    await db.insert(taskLettersTable)
      .values({
        ...formatForDatabase(testTaskLetter1),
        arrival_date: null,
        return_date: null,
        ticket_taken: null,
        official_notes: null
      })
      .execute();

    const result = await getTaskLetters();

    expect(result).toHaveLength(1);
    const taskLetter = result[0];
    
    expect(taskLetter.arrival_date).toBeNull();
    expect(taskLetter.return_date).toBeNull();
    expect(taskLetter.ticket_taken).toBeNull();
    expect(taskLetter.official_notes).toBeNull();
  });
});
