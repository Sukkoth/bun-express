/**
 * JWT authentication middleware for Express routes.
 *
 * Validates the presence and correctness of a Bearer token, decodes and
 * verifies the JWT, validates its payload, and attaches authentication context
 * to the request. Throws an AppException if authentication fails.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@utils/jwt';
import { AppException } from '@libs/exceptions/app-exception';
import validate from '@utils/validation/validate';
import { jwtPayloadSchema } from '@utils/validation/auth';
import Logger from '@libs/logger';
import asyncHandler from '@utils/async-handler';
import { getByField as getUserByField } from '@services/user-service';
import { safeCall, safeCallSync } from '@utils/safe-call';
import { UserStatus } from '@/types';
import { ErrorCodes } from '@libs/exceptions/error-codes';

export const authRestMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Extract JWT from the Authorization header (format: Bearer <token>)
    const token = req.headers?.authorization?.split(' ')?.[1];

    const result = await getUser(token);

    if (!result.success) {
      if (result.errorCode === ErrorCodes.INTERNAL_SERVER_ERROR) {
        next(
          AppException.internalServerError({ message: 'Something went wrong' }),
        );
        return;
      }

      next(AppException.unauthenticated());
      return;
    }

    req.user = result.user;
    next();
  },
);

/**
 * This function will be used by both the rest auth middleware and graphql auth
 * context
 */
export const getUser = async (token?: string) => {
  // If token is missing, immediately fail authentication
  if (!token) {
    Logger.error({
      context: 'AUTH-MIDDLEWARE',
      message: 'Token is missing',
    });
    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHENTICATED,
      user: null,
    };
  }

  // Decode and verify the JWT signature
  const [verificationError, payload] = safeCallSync(() => verifyToken(token));
  if (verificationError) {
    Logger.error({
      context: 'AUTH-MIDDLEWARE',
      message: 'Token verification failed',
      error: verificationError,
    });

    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHENTICATED,
      user: null,
    };
  }

  Logger.info({
    context: 'AUTH-MIDDLEWARE',
    message: 'Token verified',
    token,
  });

  // Validate the JWT payload against the expected schema
  const validatedPayload = validate(jwtPayloadSchema, payload, {
    throwOnError: false,
  });

  // If payload is invalid, fail authentication
  if (!validatedPayload.success) {
    Logger.error({
      message: 'Token validation failed',
      payload,
      issues: validatedPayload.error?.issues,
    });
    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHENTICATED,
      user: null,
    };
  }

  // Check if user exists and is active
  const [error, user] = await safeCall(() =>
    getUserByField({ id: validatedPayload.data.id }),
  );

  if (error) {
    Logger.error({
      message: 'Error fetching user to check authentication',
      error,
    });
    return {
      success: false,
      errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
      user: null,
    };
  }

  if (!user || !user[0]) {
    Logger.error({
      message: 'User not found',
      userId: validatedPayload.data.id,
    });
    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHENTICATED,
      user: null,
    };
  }

  if (user[0].status !== UserStatus.ACTIVE) {
    Logger.error({
      message: 'User is not active',
      status: user[0].status,
    });

    return {
      success: false,
      errorCode: ErrorCodes.UNAUTHENTICATED,
      user: null,
    };
  }

  Logger.info({
    context: 'AUTH-MIDDLEWARE',
    message: 'user found and is active',
    user: { ...user[0], password: '********' },
  });

  return {
    success: true,
    errorCode: null,
    user: { ...user[0], password: '********' },
  };
};
