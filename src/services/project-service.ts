import { Project, User } from '@/types';
import { CreateProjectSchema } from '@utils/validation/project';
import { getWorkspaceMembershipForUser } from './workspace-service';
import { checkWorkspacePermission } from '@utils/check-workspace-permission';
import { safeCall } from '@utils/safe-call';
import * as dbService from '@services/db-service';
import { randomUUIDv7 } from 'bun';
import Logger from '@libs/logger';
import { AppException } from '@libs/exceptions/app-exception';

export async function createProject({
  currentUser,
  title,
  workspaceId,
  description,
}: CreateProjectSchema & {
  currentUser: User;
}) {
  const workspaceMembership = await getWorkspaceMembershipForUser({
    userId: currentUser.id,
    workspaceId,
  });

  checkWorkspacePermission({
    user: currentUser,
    action: 'create',
    entity: 'Project',
    membership: workspaceMembership,
  });

  const [error, data] = await safeCall(() =>
    dbService.insert<Project>('projects', {
      id: randomUUIDv7(),
      createdBy: currentUser.id,
      workspaceId,
      title,
      description,
    }),
  );

  if (error) {
    Logger.error({
      message: 'Could not create project',
      error,
    });
    throw AppException.internalServerError({
      message: 'Project could not be created',
    });
  }
  Logger.info({
    message: 'Project Create Successfully',
    project: data,
    createdBy: currentUser.email,
  });

  return data;
}
