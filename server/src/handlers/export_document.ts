
import { db } from '../db';
import { taskLettersTable } from '../db/schema';
import { type ExportDocumentInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function exportDocument(input: ExportDocumentInput): Promise<{ fileUrl: string; filename: string }> {
  try {
    // Fetch the task letter data first to ensure it exists
    const taskLetters = await db.select()
      .from(taskLettersTable)
      .where(eq(taskLettersTable.id, input.id))
      .execute();

    if (taskLetters.length === 0) {
      throw new Error(`Task letter with ID ${input.id} not found`);
    }

    const taskLetter = taskLetters[0];

    // Convert numeric fields back to numbers
    const taskLetterData = {
      ...taskLetter,
      advance_money: parseFloat(taskLetter.advance_money)
    };

    // Generate filename based on register number and format
    const sanitizedRegisterNumber = taskLetter.register_number.replace(/[^a-zA-Z0-9-]/g, '-');
    const filename = `surat-tugas-${sanitizedRegisterNumber}.${input.format}`;
    
    // Generate file URL (in real implementation, this would involve actual document generation)
    const fileUrl = `/exports/${filename}`;

    // TODO: In real implementation, generate actual PDF/DOCX document here
    // This would involve:
    // 1. Creating document template with Indonesian government format
    // 2. Filling template with task letter data
    // 3. Saving document to file system or cloud storage
    // 4. Returning actual accessible URL

    return {
      fileUrl,
      filename
    };
  } catch (error) {
    console.error('Document export failed:', error);
    throw error;
  }
}
