import { User, UserRole } from '@/types';
import { AppException } from '@libs/exceptions/app-exception';
import * as userService from '@services/user-service';
import { checkUserPermissions } from '@utils/check-permissions';
import { registerUserSchema } from '@utils/validation/auth';
import validate from '@utils/validation/validate';

const userResolvers = {
  Query: {
    getUserById: async (
      _: unknown,
      args: { userId: string },
      { user: currentUser }: { user?: User },
    ) => {
      if (!currentUser) throw AppException.unauthenticated();

      /**
       * If the current user is not an admin and the requested user ID does not
       * match the current user's ID, the request should not be permitted
       */
      const userCanCheckProfile =
        currentUser.role === UserRole.ADMIN || currentUser.id === args.userId;

      checkUserPermissions({
        user: currentUser,
        requiredRole: [UserRole.ADMIN, UserRole.USER],
        extraConditions: userCanCheckProfile,
      });

      return await userService.getUserById(args.userId);
    },
  },

  Mutation: {
    registerUser: async (
      _: unknown,
      args: { email: string; name: string; password: string; role?: UserRole },
    ) => {
      const data = validate(registerUserSchema, args);
      const user = await userService.createUser(data);
      return user;
    },
  },
};

export default userResolvers;
