import { User } from '@/types';
import { AppException } from '@libs/exceptions/app-exception';
import validate from '@utils/validation/validate';
import * as projectService from '@services/project-service';
import { createProjectSchema } from '@utils/validation/project';

export default {
  Mutation: {
    createProject: async (
      _: unknown,
      args: { title?: string; description?: string; workspaceId?: string },
      { user }: { user?: User },
    ) => {
      if (!user) throw AppException.unauthenticated();

      const data = validate(createProjectSchema, args);
      return await projectService.createProject({
        currentUser: user,
        ...data,
      });
    },
  },
};
