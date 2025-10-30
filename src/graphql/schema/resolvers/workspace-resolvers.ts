import { User } from '@/types';
import { AppException } from '@libs/exceptions/app-exception';
import validate from '@utils/validation/validate';
import { workspaceCreateSchema } from '@utils/validation/workspace';
import * as workspaceService from '@services/workspace-service';

export default {
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
