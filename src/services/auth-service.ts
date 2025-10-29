import { jwtPayloadSchema, LoginSchema } from '@utils/validation/auth';
import * as userService from '@services/user-service';
import encryption from '@libs/encryption';
import { AppException } from '@libs/exceptions/app-exception';
import * as jwtUtils from '@utils/jwt';
import { User } from '@/types';
import validate from '@utils/validation/validate';
import Logger from '@libs/logger';

export async function login({ email, password }: LoginSchema) {
  const user = (await userService.getByField({ email }))?.[0];

  if (!user) {
    throw AppException.unauthenticated();
  }

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
