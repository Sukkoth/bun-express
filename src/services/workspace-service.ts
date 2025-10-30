import { safeCall } from '@utils/safe-call';
import { WorkspaceCreateSchema } from '@utils/validation/workspace';
import * as dbService from '@services/db-service';
import { Workspace, WorkspaceMembership, WorkspaceRole } from '@/types';
import Logger from '@libs/logger';
import { AppException } from '@libs/exceptions/app-exception';
import { randomUUIDv7 } from 'bun';

type CreateWorkspaceProps = {
  userId: string;
} & WorkspaceCreateSchema;
export async function createWorkspace({
  userId,
  name,
  description,
}: CreateWorkspaceProps) {
  const workspaceId = randomUUIDv7();

  const [createWorkspaceError, data] = await safeCall(() =>
    dbService.insert<Workspace>('workspaces', {
      id: workspaceId,
      name,
      description,
      createdBy: userId,
    }),
  );

  if (createWorkspaceError) {
    Logger.error({
      message: 'Failed to create workspace',
      error: createWorkspaceError,
    });
    throw AppException.internalServerError({
      message: 'Failed to create workspace',
    });
  }

  const [createMembershipError] = await safeCall(() =>
    dbService.insert<WorkspaceMembership>('workspace_memberships', {
      role: WorkspaceRole.OWNER,
      userId,
      workspaceId,
    }),
  );

  if (createMembershipError) {
    Logger.error({
      message: 'Failed to create workspace membership',
      error: createMembershipError,
    });
    await dbService.remove('workspaces', workspaceId);
    throw AppException.internalServerError({
      message: 'Failed to create workspace membership',
    });
  }

  Logger.info({
    message: 'Workspace created successfully',
    workspaceId,
    userId,
  });

  return data;
}
