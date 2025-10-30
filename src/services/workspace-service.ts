import { safeCall } from '@utils/safe-call';
import {
  WorkspaceCreateSchema,
  WorkspaceMemberCreateSchema,
  WorkspaceMemberRemoveSchema,
  WorkspaceMemberUpdateRoleSchema,
} from '@utils/validation/workspace';
import * as dbService from '@services/db-service';
import { User, Workspace, WorkspaceMembership, WorkspaceRole } from '@/types';
import Logger from '@libs/logger';
import { AppException } from '@libs/exceptions/app-exception';
import { randomUUIDv7 } from 'bun';
import { sql } from 'bun';
import { checkWorkspacePermission } from '@utils/check-workspace-permission';
import { getByField as getUserByField } from './user-service';

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
  throwIfNotFound = true,
}: {
  userId: string;
  workspaceId: string;
  throwIfNotFound?: boolean;
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

  if (!data?.[0] && throwIfNotFound) {
    Logger.error({
      message: 'Workspace membership not found',
      workspaceId,
      userId,
    });
    throw AppException.notFound({
      message: 'Workspace membership not found',
    });
  }

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
    entity: 'Workspace',
  });

  Logger.info({
    message: 'Workspace retrieved successfully',
    workspaceId,
    data: data[0],
  });

  return data[0];
}

type AddWorkspaceMemberProps = {
  currentUser: User;
} & WorkspaceMemberCreateSchema;

export async function addWorkspaceMember({
  currentUser,
  workspaceId,
  email,
  role,
}: AddWorkspaceMemberProps) {
  /** First check if the current user can create a new member */
  const workspaceMembership = await getWorkspaceMembershipForUser({
    userId: currentUser.id,
    workspaceId,
  });

  checkWorkspacePermission({
    user: currentUser,
    action: 'create',
    entity: 'Member',
    membership: workspaceMembership,
  });

  /** Then get the user that the currentUser wanted to add to the workspace */
  const user = await getUserByEmail(email);

  /** Now you can create a new membership record for the given workspace */
  const [createMembershipError, createdMembership] = await safeCall(() =>
    dbService.insert<WorkspaceMembership>('workspace_memberships', {
      role,
      userId: user.id,
      workspaceId,
    }),
  );

  if (createMembershipError) {
    Logger.error({
      message: 'Failed to create workspace membership',
      error: createMembershipError,
    });

    throw AppException.internalServerError({
      message: 'Failed to create workspace membership',
    });
  }

  Logger.info({
    message: 'Workspace membership created successfully',
    workspaceId,
    userEmail: email,
    membership: createdMembership,
  });

  return {
    ...createdMembership,
    email: email,
  };
}

export async function removeWorkspaceMember({
  currentUser,
  email,
  workspaceId,
}: WorkspaceMemberRemoveSchema & {
  currentUser: User;
}) {
  /** First check if the current user has enough permissions in the workspace */
  const workspaceMembership = await getWorkspaceMembershipForUser({
    userId: currentUser.id,
    workspaceId,
  });

  checkWorkspacePermission({
    user: currentUser,
    action: 'delete',
    entity: 'Member',
    membership: workspaceMembership,
  });

  /** Then get the user that the currentUser wanted to remove from the workspace */
  const user = (await getUserByField({ email }))?.[0];

  if (!user) {
    Logger.error({
      message: 'User not found, cannot add new membership',
      email,
    });
    throw AppException.badRequest({
      message: 'User not found',
    });
  }

  /** Then check if the user is a member of the workspace */
  const membership = await getWorkspaceMembershipForUser({
    userId: user.id,
    workspaceId,
  });

  if (!membership) {
    Logger.error({
      message: 'User is not a member of the workspace',
      email,
      workspaceId,
    });
    throw AppException.badRequest({
      message: 'User is not a member of the workspace',
    });
  }

  /** Then remove the membership */
  await dbService.remove('workspace_memberships', membership.id);

  Logger.info({
    message: 'Workspace membership removed successfully',
    workspaceId,
    userEmail: email,
  });

  return {
    ...membership,
    email: email,
  };
}

export async function updateWorkspaceMemberRole({
  currentUser,
  email,
  workspaceId,
  role,
}: WorkspaceMemberUpdateRoleSchema & {
  currentUser: User;
}) {
  /** First check if the current user has enough permissions in the workspace */
  const workspaceMembership = await getWorkspaceMembershipForUser({
    userId: currentUser.id,
    workspaceId,
  });

  checkWorkspacePermission({
    user: currentUser,
    action: 'update',
    entity: 'Member',
    membership: workspaceMembership,
  });

  /** Then get the user that the currentUser wanted to update the role of */
  const user = await getUserByEmail(email);

  /** Then check if the user is a member of the workspace */
  const membership = await getWorkspaceMembershipForUser({
    userId: user.id,
    workspaceId,
  });

  /** Then update the membership role */
  await dbService.update('workspace_memberships', membership.id, { role });

  Logger.info({
    message: 'Workspace membership role updated successfully',
    workspaceId,
    userEmail: email,
    role,
  });

  return {
    ...membership,
    email: email,
    role,
  };
}

export async function getAllWorkspaces() {
  const workspaces = await dbService.raw(sql`SELECT * FROM workspaces`);

  Logger.info({
    message: 'Workspaces fetched successfully',
    workspaces,
  });

  return workspaces;
}

async function getUserByEmail(email: string) {
  const user = (await getUserByField({ email }))?.[0];

  if (!user) {
    Logger.error({
      message: 'User not found',
      email,
    });
    throw AppException.badRequest({
      message: 'User not found',
    });
  }
  return user;
}
