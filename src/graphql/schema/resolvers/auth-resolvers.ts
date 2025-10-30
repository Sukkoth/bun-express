import { User, UserRole, UserStatus } from '@/types';
import { AppException } from '@libs/exceptions/app-exception';
import * as authService from '@services/auth-service';
import { checkUserPermissions } from '@utils/check-permissions';
import {
  adminUpdateUserStatusSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@utils/validation/auth';
import validate from '@utils/validation/validate';
export default {
  Mutation: {
    forgotPassword: async (_: unknown, args: { email: string }) => {
      const data = validate(forgotPasswordSchema, args);

      await authService.forgotPassword(data.email);
      return { success: true, message: 'Password reset email sent' };
    },

    resetPassword: async (
      _: unknown,
      args: { token: string; password: string },
    ) => {
      const data = validate(resetPasswordSchema, args);

      await authService.resetPassword({
        token: data.token,
        password: data.password,
      });

      return { success: true, message: 'Password reset successful' };
    },
    // ADMIN AUTH
    updateUserStatus: async (
      _: unknown,
      args: { email: string; status: UserStatus },
      { user }: { user?: User },
    ) => {
      if (!user) throw AppException.unauthenticated();

      checkUserPermissions({ user, requiredRole: [UserRole.ADMIN] });

      const data = validate(adminUpdateUserStatusSchema, args);

      await authService.updateUserStatus({
        email: data.email,
        status: data.status,
        updatedBy: user.id,
      });

      return {
        success: true,
        message: 'User status updated successfully',
        status: data.status,
        email: data.email,
      };
    },
  },
};
