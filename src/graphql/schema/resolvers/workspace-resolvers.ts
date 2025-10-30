import { User, UserRole, WorkspaceRole } from '@/types';
import { AppException } from '@libs/exceptions/app-exception';
import validate from '@utils/validation/validate';
import {
  workspaceCreateSchema,
  workspaceMemberCreateSchema,
  workspaceMemberRemoveSchema,
  workspaceMemberUpdateRoleSchema,
} from '@utils/validation/workspace';
import * as workspaceService from '@services/workspace-service';
import { checkUserStatus } from '@utils/check-user-status';

export default {
  Query: {
    getWorkspace: async (
      _: unknown,
      args: { id: string },
      { user }: { user?: User },
    ) => {
      if (!user) throw AppException.unauthenticated();
      checkUserStatus({
        user,
        requiredRole: [UserRole.USER],
      });

      return await workspaceService.getWorkspaceById({
        user: user,
        workspaceId: args.id,
      });
    },
    getAllWorkspaces: async (
      _: unknown,
      args: { id: string },
      { user }: { user?: User },
    ) => {
      if (!user) throw AppException.unauthenticated();
      checkUserStatus({
        user,
        requiredRole: [UserRole.ADMIN],
      });

      return await workspaceService.getAllWorkspaces();
    },
  },
  Mutation: {
    createWorkspace: async (
      _: unknown,
      args: { name: string; description?: string },
      { user }: { user?: User },
    ) => {
      if (!user) throw AppException.unauthenticated();
      const data = validate(workspaceCreateSchema, args);

      return await workspaceService.createWorkspace({
        userId: user.id,
        ...data,
      });
    },
    addWorkspaceMember: async (
      _: unknown,
      args: { workspaceId?: string; userId?: string; role?: WorkspaceRole },
      { user }: { user?: User },
    ) => {
      if (!user) throw AppException.unauthenticated();
      checkUserStatus({
        user,
        requiredRole: [UserRole.USER],
      });

      const data = validate(workspaceMemberCreateSchema, args);

      return await workspaceService.addWorkspaceMember({
        currentUser: user,
        ...data,
      });
    },
    removeWorkspaceMember: async (
      _: unknown,
      args: { workspaceId?: string; email?: string },
      { user }: { user?: User },
    ) => {
      if (!user) throw AppException.unauthenticated();
      checkUserStatus({
        user,
        requiredRole: [UserRole.USER],
      });

      const data = validate(workspaceMemberRemoveSchema, args);

      await workspaceService.removeWorkspaceMember({
        currentUser: user,
        ...data,
      });

      return true;
    },
    updateWorkspaceMemberRole: async (
      _: unknown,
      args: { workspaceId?: string; email?: string; role?: WorkspaceRole },
      { user }: { user?: User },
    ) => {
      if (!user) throw AppException.unauthenticated();
      checkUserStatus({
        user,
        requiredRole: [UserRole.USER],
      });

      const data = validate(workspaceMemberUpdateRoleSchema, args);

      return await workspaceService.updateWorkspaceMemberRole({
        currentUser: user,
        ...data,
      });
    },
    // getAllWorkspaces: () => {},
  },
};
