
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type CreateTaskLetterInput } from '../schema';
import { createTaskLetter } from '../handlers/create_task_letter';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateTaskLetterInput = {
  register_number: 'TL-2024-001',
  title: 'Official Business Trip',
  recipient_name: 'John Doe',
  recipient_position: 'Manager',
  destination_place: 'Jakarta',
  purpose: 'Attend quarterly meeting',
  start_date: new Date('2024-01-15'),
  end_date: new Date('2024-01-20'),
  transportation: 'Flight',
  advance_money: 1500000,
  signatory_name: 'Jane Smith',
  signatory_position: 'Director',
  creation_place: 'Bandung',
  creation_date: new Date('2024-01-10')
};

describe('createTaskLetter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task letter with all fields', async () => {
    const result = await createTaskLetter(testInput);

    // Verify all basic fields
    expect(result.register_number).toEqual('TL-2024-001');
    expect(result.title).toEqual('Official Business Trip');
    expect(result.recipient_name).toEqual('John Doe');
    expect(result.recipient_position).toEqual('Manager');
    expect(result.destination_place).toEqual('Jakarta');
    expect(result.purpose).toEqual('Attend quarterly meeting');
    expect(result.transportation).toEqual('Flight');
    expect(result.signatory_name).toEqual('Jane Smith');
    expect(result.signatory_position).toEqual('Director');
    expect(result.creation_place).toEqual('Bandung');

    // Verify numeric conversion
    expect(result.advance_money).toEqual(1500000);
    expect(typeof result.advance_money).toEqual('number');

    // Verify date conversions
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
    expect(result.creation_date).toBeInstanceOf(Date);
    expect(result.start_date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result.end_date.toISOString().split('T')[0]).toEqual('2024-01-20');
    expect(result.creation_date.toISOString().split('T')[0]).toEqual('2024-01-10');

    // Verify nullable fields are initially null
    expect(result.arrival_date).toBeNull();
    expect(result.return_date).toBeNull();
    expect(result.ticket_taken).toBeNull();
    expect(result.official_notes).toBeNull();

    // Verify auto-generated fields
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task letter to database', async () => {
    const result = await createTaskLetter(testInput);

    // Query database to verify persistence
    const taskLetters = await db.select()
      .from(taskLettersTable)
      .where(eq(taskLettersTable.id, result.id))
      .execute();

    expect(taskLetters).toHaveLength(1);
    const saved = taskLetters[0];
    
    expect(saved.register_number).toEqual('TL-2024-001');
    expect(saved.title).toEqual('Official Business Trip');
    expect(saved.recipient_name).toEqual('John Doe');
    expect(parseFloat(saved.advance_money)).toEqual(1500000);
    expect(saved.start_date).toEqual('2024-01-15');
    expect(saved.end_date).toEqual('2024-01-20');
    expect(saved.creation_date).toEqual('2024-01-10');
    expect(saved.created_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate register numbers', async () => {
    // Create first task letter
    await createTaskLetter(testInput);

    // Try to create another with same register number
    const duplicateInput = {
      ...testInput,
      title: 'Different Title'
    };

    await expect(createTaskLetter(duplicateInput)).rejects.toThrow(/register number already exists/i);
  });

  it('should reject end date before start date', async () => {
    const invalidInput = {
      ...testInput,
      start_date: new Date('2024-01-20'),
      end_date: new Date('2024-01-15') // End before start
    };

    await expect(createTaskLetter(invalidInput)).rejects.toThrow(/end date must be after start date/i);
  });

  it('should reject end date equal to start date', async () => {
    const sameDate = new Date('2024-01-15');
    const invalidInput = {
      ...testInput,
      start_date: sameDate,
      end_date: sameDate // Same date
    };

    await expect(createTaskLetter(invalidInput)).rejects.toThrow(/end date must be after start date/i);
  });

  it('should handle large advance money amounts', async () => {
    const largeAmountInput = {
      ...testInput,
      register_number: 'TL-2024-002',
      advance_money: 99999999.99
    };

    const result = await createTaskLetter(largeAmountInput);
    
    expect(result.advance_money).toEqual(99999999.99);
    expect(typeof result.advance_money).toEqual('number');
  });

  it('should handle zero advance money', async () => {
    const zeroAmountInput = {
      ...testInput,
      register_number: 'TL-2024-003',
      advance_money: 0
    };

    const result = await createTaskLetter(zeroAmountInput);
    
    expect(result.advance_money).toEqual(0);
    expect(typeof result.advance_money).toEqual('number');
  });
});
