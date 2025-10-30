import { safeCall } from '@utils/safe-call';
import { WorkspaceCreateSchema } from '@utils/validation/workspace';
import * as dbService from '@services/db-service';
import { User, Workspace, WorkspaceMembership, WorkspaceRole } from '@/types';
import Logger from '@libs/logger';
import { AppException } from '@libs/exceptions/app-exception';
import { randomUUIDv7 } from 'bun';
import { sql } from 'bun';
import { checkWorkspacePermission } from '@utils/check-workspace-permission';

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

export async function getWorkspaceMembershipForUser({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId: string;
}) {
  const [error, data] = await safeCall(() =>
    dbService.raw<WorkspaceMembership>(
      sql`SELECT * FROM workspace_memberships WHERE "userId" = ${userId} AND "workspaceId" = ${workspaceId}`,
    ),
  );

  if (error) {
    Logger.error({
      message: 'Failed to get workspace membership',
      error,
    });
    throw AppException.internalServerError({
      message: 'Failed to get workspace membership',
    });
  }

  Logger.info({
    message: 'Workspace membership retrieved',
    workspaceId,
    userId,
    membershipInfo: data?.[0],
  });

  return data?.[0];
}

type GetWorkspaceByIdProps = {
  user: User;
  workspaceId: string;
};

export async function getWorkspaceById({
  user,
  workspaceId,
}: GetWorkspaceByIdProps) {
  const [error, data] = await safeCall(() =>
    dbService.getByField<Workspace[]>('workspaces', 'id', workspaceId),
  );

  Logger.info({
    message: 'Workspace retrieved',
    workspaceId,
    data: data?.[0],
  });

  const workspaceMembership = await getWorkspaceMembershipForUser({
    userId: user.id,
    workspaceId,
  });

  checkWorkspacePermission({
    user,
    membership: workspaceMembership,
    action: 'read',
  });

  if (error) {
    Logger.error({
      message: 'Failed to get workspace',
      error,
    });
    throw AppException.internalServerError({
      message: 'Failed to get workspace',
    });
  }

  Logger.info({
    message: 'Workspace retrieved successfully',
    workspaceId,
    data: data[0],
  });

  return data[0];
}
