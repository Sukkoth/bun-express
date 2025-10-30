import { User, UserRole } from '@/types';
import { AppException } from '@libs/exceptions/app-exception';
import validate from '@utils/validation/validate';
import { workspaceCreateSchema } from '@utils/validation/workspace';
import * as workspaceService from '@services/workspace-service';
import { checkUserPermissions } from '@utils/check-permissions';

export default {
  Query: {
    getWorkspace: async (
      _: unknown,
      args: { id: string },
      { user }: { user?: User },
    ) => {
      if (!user) throw AppException.unauthenticated();
      checkUserPermissions({
        user,
        requiredRole: [UserRole.USER],
      });

      return await workspaceService.getWorkspaceById({
        user: user,
        workspaceId: args.id,
      });
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
    // addWorkspaceMember: () => {},
    // removeWorkspaceMember: () => {},
    // updateWorkspaceMemberRole: () => {},
    // getWorkspace: () => {},
    // getAllWorkspaces: () => {},
  },
};
