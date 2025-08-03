
import { z } from 'zod';

// Task Letter schema
export const taskLetterSchema = z.object({
  id: z.number(),
  register_number: z.string(),
  title: z.string(),
  recipient_name: z.string(),
  recipient_position: z.string(),
  destination_place: z.string(),
  purpose: z.string(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  transportation: z.string(),
  advance_money: z.number(),
  signatory_name: z.string(),
  signatory_position: z.string(),
  creation_place: z.string(),
  creation_date: z.coerce.date(),
  arrival_date: z.coerce.date().nullable(),
  return_date: z.coerce.date().nullable(),
  ticket_taken: z.boolean().nullable(),
  official_notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type TaskLetter = z.infer<typeof taskLetterSchema>;

// Input schema for creating task letters
export const createTaskLetterInputSchema = z.object({
  register_number: z.string().min(1, "Register number is required"),
  title: z.string().min(1, "Title is required"),
  recipient_name: z.string().min(1, "Recipient name is required"),
  recipient_position: z.string().min(1, "Recipient position is required"),
  destination_place: z.string().min(1, "Destination place is required"),
  purpose: z.string().min(1, "Purpose is required"),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  transportation: z.string().min(1, "Transportation is required"),
  advance_money: z.number().nonnegative(),
  signatory_name: z.string().min(1, "Signatory name is required"),
  signatory_position: z.string().min(1, "Signatory position is required"),
  creation_place: z.string().min(1, "Creation place is required"),
  creation_date: z.coerce.date()
});

export type CreateTaskLetterInput = z.infer<typeof createTaskLetterInputSchema>;

// Input schema for updating task letters
export const updateTaskLetterInputSchema = z.object({
  id: z.number(),
  register_number: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  recipient_name: z.string().min(1).optional(),
  recipient_position: z.string().min(1).optional(),
  destination_place: z.string().min(1).optional(),
  purpose: z.string().min(1).optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  transportation: z.string().min(1).optional(),
  advance_money: z.number().nonnegative().optional(),
  signatory_name: z.string().min(1).optional(),
  signatory_position: z.string().min(1).optional(),
  creation_place: z.string().min(1).optional(),
  creation_date: z.coerce.date().optional(),
  arrival_date: z.coerce.date().nullable().optional(),
  return_date: z.coerce.date().nullable().optional(),
  ticket_taken: z.boolean().nullable().optional(),
  official_notes: z.string().nullable().optional()
});

export type UpdateTaskLetterInput = z.infer<typeof updateTaskLetterInputSchema>;

// Input schema for updating official completion details
export const updateOfficialDetailsInputSchema = z.object({
  id: z.number(),
  arrival_date: z.coerce.date().nullable(),
  return_date: z.coerce.date().nullable(),
  ticket_taken: z.boolean().nullable(),
  official_notes: z.string().nullable()
});

export type UpdateOfficialDetailsInput = z.infer<typeof updateOfficialDetailsInputSchema>;

// Export document schema
export const exportDocumentInputSchema = z.object({
  id: z.number(),
  format: z.enum(['pdf', 'docx'])
});

export type ExportDocumentInput = z.infer<typeof exportDocumentInputSchema>;

// Get task letter by ID schema
export const getTaskLetterByIdInputSchema = z.object({
  id: z.number()
});

export type GetTaskLetterByIdInput = z.infer<typeof getTaskLetterByIdInputSchema>;

// Delete task letter schema
export const deleteTaskLetterInputSchema = z.object({
  id: z.number()
});

export type DeleteTaskLetterInput = z.infer<typeof deleteTaskLetterInputSchema>;
