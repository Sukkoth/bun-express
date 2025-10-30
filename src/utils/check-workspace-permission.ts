import { User, WorkspaceMembership, WorkspaceRole } from '@/types';
import { AppException } from '@libs/exceptions/app-exception';
import Logger from '@libs/logger';

export type WorkspaceActions =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'assignRole';

type CheckWorkspacePermissionProps = {
  user: User;
  membership?: WorkspaceMembership;
  action: WorkspaceActions;
};

export function checkWorkspacePermission(args: CheckWorkspacePermissionProps) {
  if (!args.membership) {
    Logger.error({
      message: 'User is not a member of the workspace',
      user: {
        id: args.user.id,
        email: args.user.email,
        name: args.user.name,
      },
      action: args.action,
    });
    throw AppException.unauthorized({
      message: 'User is not a member of the workspace',
    });
  }

  //check if the user can perform the action
  return can[args.membership.role].includes(args.action);
}

const can: Record<WorkspaceRole, WorkspaceActions[]> = {
  [WorkspaceRole.VIEWER]: ['read'],
  [WorkspaceRole.MEMBER]: ['create', 'read', 'update', 'delete'],
  [WorkspaceRole.OWNER]: ['create', 'read', 'update', 'delete', 'assignRole'],
};
