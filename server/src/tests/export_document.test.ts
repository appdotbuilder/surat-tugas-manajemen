
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type ExportDocumentInput } from '../schema';
import { exportDocument } from '../handlers/export_document';

describe('exportDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test task letter
  const createTestTaskLetter = async (registerNumber: string = 'ST-001/2024') => {
    const insertResult = await db.insert(taskLettersTable)
      .values({
        register_number: registerNumber,
        title: 'Surat Tugas Dinas Luar Kota',
        recipient_name: 'John Doe',
        recipient_position: 'Staff Ahli',
        destination_place: 'Jakarta',
        purpose: 'Menghadiri rapat koordinasi',
        start_date: '2024-01-15', // String format for date column
        end_date: '2024-01-17',   // String format for date column
        transportation: 'Pesawat',
        advance_money: '2500000.00', // String format for numeric column
        signatory_name: 'Jane Smith',
        signatory_position: 'Kepala Bagian',
        creation_place: 'Bandung',
        creation_date: '2024-01-10' // String format for date column
      })
      .returning()
      .execute();

    return insertResult[0].id;
  };

  it('should export document in PDF format', async () => {
    const taskLetterId = await createTestTaskLetter();

    const input: ExportDocumentInput = {
      id: taskLetterId,
      format: 'pdf'
    };

    const result = await exportDocument(input);

    expect(result.fileUrl).toContain('/exports/');
    expect(result.fileUrl).toContain('.pdf');
    expect(result.filename).toContain('surat-tugas-');
    expect(result.filename).toContain('.pdf');
    expect(result.filename).toContain('ST-001-2024'); // Sanitized register number
  });

  it('should export document in DOCX format', async () => {
    const taskLetterId = await createTestTaskLetter();

    const input: ExportDocumentInput = {
      id: taskLetterId,
      format: 'docx'
    };

    const result = await exportDocument(input);

    expect(result.fileUrl).toContain('/exports/');
    expect(result.fileUrl).toContain('.docx');
    expect(result.filename).toContain('surat-tugas-');
    expect(result.filename).toContain('.docx');
    expect(result.filename).toContain('ST-001-2024'); // Sanitized register number
  });

  it('should sanitize register number in filename', async () => {
    const taskLetterId = await createTestTaskLetter('ST/001#2024@TEST');

    const input: ExportDocumentInput = {
      id: taskLetterId,
      format: 'pdf'
    };

    const result = await exportDocument(input);

    // Special characters should be replaced with dashes
    expect(result.filename).toContain('ST-001-2024-TEST');
    expect(result.filename).not.toMatch(/[/#@]/);
  });

  it('should throw error for non-existent task letter', async () => {
    const input: ExportDocumentInput = {
      id: 99999,
      format: 'pdf'
    };

    await expect(exportDocument(input)).rejects.toThrow(/not found/i);
  });

  it('should generate different filenames for different task letters', async () => {
    const taskLetterId1 = await createTestTaskLetter('ST-001/2024');
    const taskLetterId2 = await createTestTaskLetter('ST-002/2024');

    const export1 = await exportDocument({ id: taskLetterId1, format: 'pdf' });
    const export2 = await exportDocument({ id: taskLetterId2, format: 'pdf' });

    expect(export1.filename).toContain('ST-001-2024');
    expect(export2.filename).toContain('ST-002-2024');
    expect(export1.filename).not.toEqual(export2.filename);
  });

  it('should handle task letter with numeric advance_money correctly', async () => {
    const taskLetterId = await createTestTaskLetter();

    const input: ExportDocumentInput = {
      id: taskLetterId,
      format: 'pdf'
    };

    // Should not throw error and should generate valid filename
    const result = await exportDocument(input);

    expect(result.fileUrl).toBeDefined();
    expect(result.filename).toBeDefined();
    expect(typeof result.fileUrl).toBe('string');
    expect(typeof result.filename).toBe('string');
  });
});
