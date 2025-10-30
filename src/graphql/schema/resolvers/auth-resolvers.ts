import * as authService from '@services/auth-service';
import {
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
  },
};
