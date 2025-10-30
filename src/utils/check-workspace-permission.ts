import { User, WorkspaceMembership, WorkspaceRole } from '@/types';
import { AppException } from '@libs/exceptions/app-exception';
import Logger from '@libs/logger';

export type WorkspaceActions = 'create' | 'read' | 'update' | 'delete';
export type Entities = 'Workspace' | 'Project' | 'Task' | 'Member';

type CheckWorkspacePermissionProps = {
  user: User;
  membership: WorkspaceMembership;
  action: WorkspaceActions;
  entity: Entities;
};

export function checkWorkspacePermission(args: CheckWorkspacePermissionProps) {
  const userRole = args?.membership?.role || 'NONE';

  const permittedActions = workspacePermissions[userRole].actions.includes(
    args.action,
  );

  const permittedEntities = workspacePermissions[userRole].entities.includes(
    args.entity,
  );

  if (!permittedActions || !permittedEntities) {
    Logger.error({
      message: 'User is not authorized to perform the action',
      user: {
        id: args.user.id,
        email: args.user.email,
        name: args.user.name,
      },
      action: args.action,
      entity: args.entity,
      membership: args.membership,
    });

    throw AppException.unauthorized({
      message: 'Unauthorized action',
    });
  }
}

const workspacePermissions: Record<
  WorkspaceRole | 'NONE',
  { actions: WorkspaceActions[]; entities: Entities[] }
> = {
  [WorkspaceRole.VIEWER]: {
    actions: ['read'],
    entities: ['Workspace', 'Project', 'Task', 'Member'],
  },
  [WorkspaceRole.MEMBER]: {
    actions: ['read'],
    entities: ['Workspace', 'Project', 'Task', 'Member'],
  },
  [WorkspaceRole.OWNER]: {
    actions: ['create', 'read', 'update', 'delete'],
    entities: ['Workspace', 'Project', 'Task', 'Member'],
  },

  ['NONE']: {
    actions: [],
    entities: [],
  },
};
