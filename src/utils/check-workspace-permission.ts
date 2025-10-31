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
  const permissions = workspacePermissions[userRole] || [];

  const hasPermission = permissions.some(
    (perm) =>
      perm.entities.includes(args.entity) && perm.actions.includes(args.action),
  );

  if (!hasPermission) {
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
  { actions: WorkspaceActions[]; entities: Entities[] }[]
> = {
  [WorkspaceRole.VIEWER]: [
    {
      actions: ['read'],
      entities: ['Workspace'],
    },
  ],
  [WorkspaceRole.MEMBER]: [
    {
      actions: ['read'],
      entities: ['Workspace'],
    },
    {
      actions: ['create', 'read', 'update', 'delete'],
      entities: ['Project'],
    },
  ],
  [WorkspaceRole.OWNER]: [
    {
      actions: ['create', 'read', 'update', 'delete'],
      entities: ['Workspace', 'Member', 'Project'],
    },
  ],

  ['NONE']: [
    {
      actions: [],
      entities: [],
    },
  ],
};
