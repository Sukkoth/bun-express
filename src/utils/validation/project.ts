import { ProjectRole } from '@/types';
import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(4),
  workspaceId: z.string().uuid(),
  description: z.string().optional(),
});

export const getProjectByIdSchema = z.object({
  id: z.string().uuid(),
});

export const updateProjectSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(4).optional(),
  description: z.string().optional(),
});

export const assignProjectMembershipSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email(),
  role: z.nativeEnum(ProjectRole),
});

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;
export type UpdateProjectSchema = z.infer<typeof updateProjectSchema>;
export type AssignProjectMembershipSchema = z.infer<
  typeof assignProjectMembershipSchema
>;
