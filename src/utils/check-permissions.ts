import { User, UserRole, UserStatus } from '@/types';
import { AppException } from '@libs/exceptions/app-exception';
import Logger from '@libs/logger';

type CheckUserPermissions = {
  /** The user object to check permissions for */
  user: User;
  /** List of required roles for the user */
  requiredRole: UserRole[];
  /**
   * Extra conditions that need to be checked
   *
   * @note - Extra conditions should be evaluated to `true` for successful authorization
   */
  extraConditions?: boolean;
};

/**
 * Check user permissions. Checks if the user is active, has the required role,
 * and passes any extra conditions.
 */
export function checkUserPermissions({
  user,
  requiredRole = [UserRole.USER],
  extraConditions,
}: CheckUserPermissions) {
  Logger.debug('checkUserPermissions', { user, requiredRole, extraConditions });

  if (
    !user ||
    user.status !== UserStatus.ACTIVE ||
    !requiredRole.includes(user.role) ||
    (extraConditions !== undefined && !extraConditions)
  ) {
    Logger.error({
      message: 'Unauthorized',
      user: { ...user, password: '********' },
    });

    throw AppException.unauthorized({
      message:
        user.status === UserStatus.BANNED
          ? 'Banned user, cannot access this request'
          : 'Unauthorized',
    });
  }
}
