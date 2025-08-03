
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type UpdateTaskLetterInput } from '../schema';
import { updateTaskLetter } from '../handlers/update_task_letter';
import { eq } from 'drizzle-orm';

describe('updateTaskLetter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic task letter fields', async () => {
    // Create initial task letter directly using raw SQL to avoid type issues
    await db.execute(`
      INSERT INTO task_letters (
        register_number, title, recipient_name, recipient_position, 
        destination_place, purpose, start_date, end_date, 
        transportation, advance_money, signatory_name, signatory_position,
        creation_place, creation_date
      ) VALUES (
        'TL001/2024', 'Business Trip to Jakarta', 'John Doe', 'Manager',
        'Jakarta', 'Client meeting', '2024-02-01', '2024-02-05',
        'Flight', '1500.50', 'Jane Smith', 'Director',
        'Bandung', '2024-01-25'
      )
    `);

    // Get the created record
    const records = await db.select().from(taskLettersTable).execute();
    const created = records[0];

    const updateInput: UpdateTaskLetterInput = {
      id: created.id,
      title: 'Updated Business Trip',
      purpose: 'Updated client meeting',
      advance_money: 2000.75
    };

    const result = await updateTaskLetter(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.title).toEqual('Updated Business Trip');
    expect(result.purpose).toEqual('Updated client meeting');
    expect(result.advance_money).toEqual(2000.75);
    expect(typeof result.advance_money).toEqual('number');
    expect(result.register_number).toEqual('TL001/2024'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > created.updated_at).toBe(true);
  });

  it('should update task letter in database', async () => {
    await db.execute(`
      INSERT INTO task_letters (
        register_number, title, recipient_name, recipient_position, 
        destination_place, purpose, start_date, end_date, 
        transportation, advance_money, signatory_name, signatory_position,
        creation_place, creation_date
      ) VALUES (
        'TL001/2024', 'Business Trip to Jakarta', 'John Doe', 'Manager',
        'Jakarta', 'Client meeting', '2024-02-01', '2024-02-05',
        'Flight', '1500.50', 'Jane Smith', 'Director',
        'Bandung', '2024-01-25'
      )
    `);

    const records = await db.select().from(taskLettersTable).execute();
    const created = records[0];

    const updateInput: UpdateTaskLetterInput = {
      id: created.id,
      recipient_name: 'Jane Updated',
      destination_place: 'Surabaya'
    };

    await updateTaskLetter(updateInput);

    const dbRecord = await db.select()
      .from(taskLettersTable)
      .where(eq(taskLettersTable.id, created.id))
      .execute();

    expect(dbRecord).toHaveLength(1);
    expect(dbRecord[0].recipient_name).toEqual('Jane Updated');
    expect(dbRecord[0].destination_place).toEqual('Surabaya');
    expect(dbRecord[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update official details fields', async () => {
    await db.execute(`
      INSERT INTO task_letters (
        register_number, title, recipient_name, recipient_position, 
        destination_place, purpose, start_date, end_date, 
        transportation, advance_money, signatory_name, signatory_position,
        creation_place, creation_date
      ) VALUES (
        'TL001/2024', 'Business Trip to Jakarta', 'John Doe', 'Manager',
        'Jakarta', 'Client meeting', '2024-02-01', '2024-02-05',
        'Flight', '1500.50', 'Jane Smith', 'Director',
        'Bandung', '2024-01-25'
      )
    `);

    const records = await db.select().from(taskLettersTable).execute();
    const created = records[0];

    const updateInput: UpdateTaskLetterInput = {
      id: created.id,
      arrival_date: new Date('2024-02-01'),
      return_date: new Date('2024-02-05'),
      ticket_taken: true,
      official_notes: 'Trip completed successfully'
    };

    const result = await updateTaskLetter(updateInput);

    expect(result.arrival_date).toEqual(new Date('2024-02-01'));
    expect(result.return_date).toEqual(new Date('2024-02-05'));
    expect(result.ticket_taken).toBe(true);
    expect(result.official_notes).toEqual('Trip completed successfully');
  });

  it('should throw error when task letter not found', async () => {
    const updateInput: UpdateTaskLetterInput = {
      id: 99999,
      title: 'Non-existent task letter'
    };

    await expect(updateTaskLetter(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error when register number already exists', async () => {
    // Create first task letter
    await db.execute(`
      INSERT INTO task_letters (
        register_number, title, recipient_name, recipient_position, 
        destination_place, purpose, start_date, end_date, 
        transportation, advance_money, signatory_name, signatory_position,
        creation_place, creation_date
      ) VALUES (
        'TL001/2024', 'Business Trip to Jakarta', 'John Doe', 'Manager',
        'Jakarta', 'Client meeting', '2024-02-01', '2024-02-05',
        'Flight', '1500.50', 'Jane Smith', 'Director',
        'Bandung', '2024-01-25'
      )
    `);

    // Create second task letter
    await db.execute(`
      INSERT INTO task_letters (
        register_number, title, recipient_name, recipient_position, 
        destination_place, purpose, start_date, end_date, 
        transportation, advance_money, signatory_name, signatory_position,
        creation_place, creation_date
      ) VALUES (
        'TL002/2024', 'Another Business Trip', 'Jane Doe', 'Senior Manager',
        'Surabaya', 'Training', '2024-03-01', '2024-03-05',
        'Train', '1000.00', 'Bob Smith', 'CEO',
        'Jakarta', '2024-02-25'
      )
    `);

    const records = await db.select().from(taskLettersTable).execute();
    const firstRecord = records.find(r => r.register_number === 'TL001/2024');

    // Try to update first task letter with second's register number
    const updateInput: UpdateTaskLetterInput = {
      id: firstRecord!.id,
      register_number: 'TL002/2024'
    };

    await expect(updateTaskLetter(updateInput)).rejects.toThrow(/already exists/i);
  });

  it('should allow updating register number to same value', async () => {
    await db.execute(`
      INSERT INTO task_letters (
        register_number, title, recipient_name, recipient_position, 
        destination_place, purpose, start_date, end_date, 
        transportation, advance_money, signatory_name, signatory_position,
        creation_place, creation_date
      ) VALUES (
        'TL001/2024', 'Business Trip to Jakarta', 'John Doe', 'Manager',
        'Jakarta', 'Client meeting', '2024-02-01', '2024-02-05',
        'Flight', '1500.50', 'Jane Smith', 'Director',
        'Bandung', '2024-01-25'
      )
    `);

    const records = await db.select().from(taskLettersTable).execute();
    const created = records[0];

    const updateInput: UpdateTaskLetterInput = {
      id: created.id,
      register_number: 'TL001/2024', // Same register number
      title: 'Updated title'
    };

    const result = await updateTaskLetter(updateInput);
    expect(result.register_number).toEqual('TL001/2024');
    expect(result.title).toEqual('Updated title');
  });

  it('should validate end date is after start date when updating both', async () => {
    await db.execute(`
      INSERT INTO task_letters (
        register_number, title, recipient_name, recipient_position, 
        destination_place, purpose, start_date, end_date, 
        transportation, advance_money, signatory_name, signatory_position,
        creation_place, creation_date
      ) VALUES (
        'TL001/2024', 'Business Trip to Jakarta', 'John Doe', 'Manager',
        'Jakarta', 'Client meeting', '2024-02-01', '2024-02-05',
        'Flight', '1500.50', 'Jane Smith', 'Director',
        'Bandung', '2024-01-25'
      )
    `);

    const records = await db.select().from(taskLettersTable).execute();
    const created = records[0];

    const updateInput: UpdateTaskLetterInput = {
      id: created.id,
      start_date: new Date('2024-02-10'),
      end_date: new Date('2024-02-05') // End before start
    };

    await expect(updateTaskLetter(updateInput)).rejects.toThrow(/after start date/i);
  });

  it('should validate start date against existing end date', async () => {
    await db.execute(`
      INSERT INTO task_letters (
        register_number, title, recipient_name, recipient_position, 
        destination_place, purpose, start_date, end_date, 
        transportation, advance_money, signatory_name, signatory_position,
        creation_place, creation_date
      ) VALUES (
        'TL001/2024', 'Business Trip to Jakarta', 'John Doe', 'Manager',
        'Jakarta', 'Client meeting', '2024-02-01', '2024-02-05',
        'Flight', '1500.50', 'Jane Smith', 'Director',
        'Bandung', '2024-01-25'
      )
    `);

    const records = await db.select().from(taskLettersTable).execute();
    const created = records[0];

    const updateInput: UpdateTaskLetterInput = {
      id: created.id,
      start_date: new Date('2024-02-10') // After existing end date (2024-02-05)
    };

    await expect(updateTaskLetter(updateInput)).rejects.toThrow(/before end date/i);
  });

  it('should validate end date against existing start date', async () => {
    await db.execute(`
      INSERT INTO task_letters (
        register_number, title, recipient_name, recipient_position, 
        destination_place, purpose, start_date, end_date, 
        transportation, advance_money, signatory_name, signatory_position,
        creation_place, creation_date
      ) VALUES (
        'TL001/2024', 'Business Trip to Jakarta', 'John Doe', 'Manager',
        'Jakarta', 'Client meeting', '2024-02-01', '2024-02-05',
        'Flight', '1500.50', 'Jane Smith', 'Director',
        'Bandung', '2024-01-25'
      )
    `);

    const records = await db.select().from(taskLettersTable).execute();
    const created = records[0];

    const updateInput: UpdateTaskLetterInput = {
      id: created.id,
      end_date: new Date('2024-01-25') // Before existing start date (2024-02-01)
    };

    await expect(updateTaskLetter(updateInput)).rejects.toThrow(/after start date/i);
  });

  it('should update dates correctly when valid', async () => {
    await db.execute(`
      INSERT INTO task_letters (
        register_number, title, recipient_name, recipient_position, 
        destination_place, purpose, start_date, end_date, 
        transportation, advance_money, signatory_name, signatory_position,
        creation_place, creation_date
      ) VALUES (
        'TL001/2024', 'Business Trip to Jakarta', 'John Doe', 'Manager',
        'Jakarta', 'Client meeting', '2024-02-01', '2024-02-05',
        'Flight', '1500.50', 'Jane Smith', 'Director',
        'Bandung', '2024-01-25'
      )
    `);

    const records = await db.select().from(taskLettersTable).execute();
    const created = records[0];

    const updateInput: UpdateTaskLetterInput = {
      id: created.id,
      start_date: new Date('2024-02-02'),
      end_date: new Date('2024-02-08')
    };

    const result = await updateTaskLetter(updateInput);

    expect(result.start_date).toEqual(new Date('2024-02-02'));
    expect(result.end_date).toEqual(new Date('2024-02-08'));
  });
});
