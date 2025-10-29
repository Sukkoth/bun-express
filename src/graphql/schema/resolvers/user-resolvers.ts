import type { User, UserRole } from '@/types';
import { AppException } from '@libs/exceptions/app-exception';
import * as userService from '@services/user-service';
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

      const user = await userService.getUserById(args.userId);
      return user;
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
