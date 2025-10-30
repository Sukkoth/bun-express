import { WorkspaceRole } from '@/types';
import { z } from 'zod';

export const workspaceCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(2).max(1000).optional(),
});

export const workspaceMemberCreateSchema = z.object({
  email: z.string().email(),
  workspaceId: z.string().uuid(),
  role: z.nativeEnum(WorkspaceRole),
});

export type WorkspaceCreateSchema = z.infer<typeof workspaceCreateSchema>;
export type WorkspaceMemberCreateSchema = z.infer<
  typeof workspaceMemberCreateSchema
>;
