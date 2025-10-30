import { z } from 'zod';

export const workspaceCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(2).max(1000).optional(),
});

export type WorkspaceCreateSchema = z.infer<typeof workspaceCreateSchema>;
