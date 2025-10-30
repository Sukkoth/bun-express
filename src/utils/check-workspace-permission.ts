import { User, WorkspaceRole, WorkspaceMembership } from '@/types';

type CheckWorkspacePermissionProps = {
  user: User & WorkspaceMembership;
  expectedRoles: WorkspaceRole;
  extraConditions: boolean;
};

export function checkWorkspacePermission(args: CheckWorkspacePermissionProps) {
  return args.extraConditions;
}
