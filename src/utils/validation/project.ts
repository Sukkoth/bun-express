import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(4),
  workspaceId: z.string().uuid(),
  description: z.string().optional(),
});

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;
