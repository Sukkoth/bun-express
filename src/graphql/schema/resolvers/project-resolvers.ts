import { User } from '@/types';
import { AppException } from '@libs/exceptions/app-exception';
import validate from '@utils/validation/validate';
import * as projectService from '@services/project-service';
import {
  createProjectSchema,
  getProjectByIdSchema,
} from '@utils/validation/project';

export default {
  Query: {
    getProjectById: async (
      _: unknown,
      args: { id: string },
      { user }: { user?: User },
    ) => {
      if (!user) throw AppException.unauthenticated();

      const { id } = validate(getProjectByIdSchema, args);
      return await projectService.getProjectById({
        currentUser: user,
        id,
      });
    },
  },
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
