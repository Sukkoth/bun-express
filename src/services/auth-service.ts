import {
  AdminResetPasswordForUserSchema,
  AdminUpdateUserStatusSchema,
  jwtPayloadSchema,
  LoginSchema,
} from '@utils/validation/auth';
import * as userService from '@services/user-service';
import encryption from '@libs/encryption';
import { AppException } from '@libs/exceptions/app-exception';
import * as jwtUtils from '@utils/jwt';
import { PasswordResetToken, User, UserRole } from '@/types';
import validate from '@utils/validation/validate';
import Logger from '@libs/logger';
import { safeCall } from '@utils/safe-call';
import * as emailService from '@services/email-service';
import * as dbService from '@services/db-service';
import { checkUserPermissions } from '@utils/check-permissions';

export async function login({ email, password }: LoginSchema) {
  const user = (await userService.getByField({ email }))?.[0];

  if (!user) {
    throw AppException.unauthenticated();
  }

  checkUserPermissions({ user, requiredRole: [UserRole.ADMIN, UserRole.USER] });

  const isMatch = encryption.compareHash(password, user.password);

  if (!isMatch) {
    Logger.error({
      message: 'Invalid password',
      email,
      userId: user.id,
    });
    throw AppException.unauthenticated();
  }

  return generateTokens(user);
}

export async function refreshToken(refreshToken: string) {
  if (!refreshToken) {
    Logger.error({
      message: 'Refresh token is missing, cannot generate new tokens',
    });
    throw AppException.unauthenticated();
  }

  Logger.info({
    message: 'Refresh token received',
    refreshToken,
  });

  const payload = jwtUtils.verifyToken(refreshToken);

  // validate if the verified jwt token as valid payload data since it will be
  // used in other operations
  const { data: validatedPayload, success: payloadValidationSuccess } =
    validate(jwtPayloadSchema, payload, {
      throwOnError: false,
    });

  if (!payloadValidationSuccess) {
    throw AppException.unauthenticated();
  }

  Logger.info({
    message: 'Token signature verification and validation passed',
    payload,
    validatedPayload,
  });

  const user = (await userService.getByField({ id: validatedPayload.id }))?.[0];

  if (!user) {
    Logger.error({
      message: 'User not found via ID from refresh token',
      userId: validatedPayload.id,
    });
    throw AppException.unauthenticated();
  }

  checkUserPermissions({ user, requiredRole: [UserRole.ADMIN, UserRole.USER] });

  return generateTokens(user);
}

export function generateTokens(user: User) {
  const payload = {
    id: user.id,
    role: user.role,
  };

  const accessToken = jwtUtils.generateToken({
    payload,
    expiresIn: '15m',
  });

  const refreshToken = jwtUtils.generateToken({
    payload,
    expiresIn: '7d',
  });

  Logger.info({
    message: 'Tokens generated',
    payload,
    accessToken,
    refreshToken,
  });

  return { accessToken, refreshToken };
}

export async function forgotPassword(email: string) {
  const [error, data] = await safeCall(() => userService.getByField({ email }));

  if (error) {
    Logger.error({
      message: 'Error fetching user for forgot password',
      error,
    });
    throw AppException.internalServerError({ message: 'Something Went Wrong' });
  }

  if (!data || !data[0]) {
    Logger.error({
      message: 'User not found',
      email,
    });
    throw AppException.notFound({ message: 'User not found' });
  }

  const user = data[0];

  checkUserPermissions({ user, requiredRole: [UserRole.ADMIN, UserRole.USER] });

  const token = jwtUtils.generateToken({
    payload: { id: user.id },
    expiresIn: '10m',
  });

  await dbService.insert('password_reset_tokens', {
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    used: false,
    createdAt: new Date(),
  });

  const passwordResetEmailTemplate = emailService.generateEmailTemplate(
    'forgotPassword',
    {
      token,
    },
  );

  await emailService.sendEmail({
    to: email,
    clientName: user.name,
    subject: 'Password Reset',
    html: passwordResetEmailTemplate,
  });

  Logger.info({
    message: 'Password reset email sent',
    email,
    user,
  });
}

type ResetPasswordProps = {
  token: string;
  password: string;
};

export async function resetPassword({ token, password }: ResetPasswordProps) {
  /** Validate the token integrity and extract the user id if the token is valid */
  const validateToken = jwtUtils.verifyToken<{ id: string }>(token);

  /** Get the user based on the id extracted */
  const [error, data] = await safeCall(() =>
    userService.getByField({ id: validateToken.id }),
  );

  /** Get the token if the user has one */
  const [tokenFetchError, tokenFromDb] = await safeCall(() =>
    dbService.getByField<PasswordResetToken>(
      'password_reset_tokens',
      'userId',
      validateToken.id,
    ),
  );

  if (error || tokenFetchError) {
    Logger.error({
      message: error
        ? 'Error fetching user for reset password'
        : 'Error fetching existing token for reset password',
      error,
    });
    throw AppException.internalServerError({ message: 'Something Went Wrong' });
  }

  if (!data || !data[0]) {
    Logger.error({
      message: 'User not found',
      token,
    });
    throw AppException.notFound({ message: 'User not found' });
  }

  const user = data[0];

  checkUserPermissions({ user, requiredRole: [UserRole.ADMIN, UserRole.USER] });

  /** Take the latest token the user generated for password reset */
  const fetchedToken = tokenFromDb?.[tokenFromDb.length - 1];

  Logger.info({
    fetchedToken,
    expired: new Date(fetchedToken.expiresAt).getTime() < Date.now(),
    now: new Date(Date.now()),
  });

  if (!tokenFromDb || !fetchedToken) {
    Logger.error({
      message: 'Token not found, abort resetting password',
      user: data[0],
      tokenFromDb: tokenFromDb[tokenFromDb.length - 1],
      token,
    });

    throw AppException.badRequest({
      message: 'Invalid Password reset request',
    });
  }

  /** Check if the reset token has expired or used */
  if (
    fetchedToken.token !== token ||
    fetchedToken.used ||
    new Date(fetchedToken.expiresAt).getTime() < Date.now()
  ) {
    Logger.error({
      message: 'Token expired or invalid',
      user,
      token,
      tokenFromDb,
    });

    throw AppException.badRequest({
      message: 'Invalid Password reset request',
    });
  }

  /** Update the token status to used */

  const hashedPassword = encryption.hash(password);

  await Promise.all([
    userService.updateUser(user.id, { password: hashedPassword }),
    dbService.update<PasswordResetToken>(
      'password_reset_tokens',
      fetchedToken.id,
      { used: true },
    ),
  ]);

  Logger.info({
    message: 'Password reset successful',
    user,
  });
}

export async function adminResetPasswordForUser({
  email,
  password,
  resetBy,
}: AdminResetPasswordForUserSchema & {
  resetBy: string;
}) {
  const [error, data] = await safeCall(() => userService.getByField({ email }));

  if (error) {
    Logger.error({
      message: 'Error fetching user',
      email,
      error,
    });
    throw AppException.internalServerError({ message: 'Something went wrong' });
  }

  if (!data || !data?.[0]) {
    Logger.error({
      message: 'User not found',
      email,
    });
    throw AppException.notFound({ message: 'User not found' });
  }

  const hashedPassword = encryption.hash(password);

  userService.updateUser(data[0].id, { password: hashedPassword });

  Logger.info({
    message: 'Password reset for user by admin',
    userEmail: data[0].email,
    resetBy,
  });
}

export async function updateUserStatus({
  email,
  status,
  updatedBy,
}: AdminUpdateUserStatusSchema & {
  updatedBy: string;
}) {
  const [error, data] = await safeCall(() => userService.getByField({ email }));

  if (error) {
    Logger.error({
      message: 'Error fetching user',
      email,
      error,
    });
    throw AppException.internalServerError({ message: 'Something went wrong' });
  }

  if (!data || !data?.[0]) {
    Logger.error({
      message: 'User not found',
      email,
    });
    throw AppException.notFound({ message: 'User not found' });
  }

  await userService.updateUser(data[0].id, { status });

  Logger.info({
    message: 'User status updated',
    updatedBy,
    email: data[0].email,
    userName: data[0].name,
  });
}
