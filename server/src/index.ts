
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createTaskLetterInputSchema, 
  updateTaskLetterInputSchema,
  updateOfficialDetailsInputSchema,
  getTaskLetterByIdInputSchema,
  deleteTaskLetterInputSchema,
  exportDocumentInputSchema
} from './schema';

// Import handlers
import { createTaskLetter } from './handlers/create_task_letter';
import { getTaskLetters } from './handlers/get_task_letters';
import { getTaskLetterById } from './handlers/get_task_letter_by_id';
import { updateTaskLetter } from './handlers/update_task_letter';
import { updateOfficialDetails } from './handlers/update_official_details';
import { deleteTaskLetter } from './handlers/delete_task_letter';
import { exportDocument } from './handlers/export_document';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Task Letter CRUD operations
  createTaskLetter: publicProcedure
    .input(createTaskLetterInputSchema)
    .mutation(({ input }) => createTaskLetter(input)),
    
  getTaskLetters: publicProcedure
    .query(() => getTaskLetters()),
    
  getTaskLetterById: publicProcedure
    .input(getTaskLetterByIdInputSchema)
    .query(({ input }) => getTaskLetterById(input)),
    
  updateTaskLetter: publicProcedure
    .input(updateTaskLetterInputSchema)
    .mutation(({ input }) => updateTaskLetter(input)),
    
  updateOfficialDetails: publicProcedure
    .input(updateOfficialDetailsInputSchema)
    .mutation(({ input }) => updateOfficialDetails(input)),
    
  deleteTaskLetter: publicProcedure
    .input(deleteTaskLetterInputSchema)
    .mutation(({ input }) => deleteTaskLetter(input)),
    
  // Document export functionality
  exportDocument: publicProcedure
    .input(exportDocumentInputSchema)
    .mutation(({ input }) => exportDocument(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
