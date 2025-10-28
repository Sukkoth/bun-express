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
import { jwtAuthSchema } from '@utils/validation/jwt-auth-schema';
import { prisma } from '@libs/prisma';
import { SenderIdWithSmsCenter } from '@/types/types';
import Logger from '@libs/logger';
import asyncHandler from '@utils/async-handler';

export const authenticateJWT = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Extract JWT from the Authorization header (format: Bearer <token>)
    const token = req.headers?.authorization?.split(' ')?.[1];

    // If token is missing, immediately fail authentication
    if (!token) {
      Logger.error({
        context: 'AUTH-MIDDLEWARE',
        message: 'Token is missing',
      });
      next(
        AppException.unauthenticated({
          message: 'Unauthenticated',
        }),
      );
      return;
    }

    // Decode and verify the JWT signature
    const payload = verifyToken(token);
    Logger.info({
      context: 'AUTH-MIDDLEWARE',
      message: 'Token verified',
      token,
    });

    // Validate the JWT payload against the expected schema
    const validatedPayload = validate(jwtAuthSchema, payload, {
      throwOnError: false,
    });

    // If payload is invalid, fail authentication
    if (!validatedPayload.success) {
      Logger.error({
        context: 'AUTH-MIDDLEWARE',
        message: 'Token validation failed',
        payload,
        issues: validatedPayload.error?.issues,
      });
      next(
        AppException.unauthenticated({
          message: 'Unauthenticated',
        }),
      );
      return;
    }

    // Check if company exists and is active
    const company = await prisma.company.findUnique({
      where: {
        id: validatedPayload.data.companyId,
      },
    });

    if (!company || company.status !== 'active') {
      Logger.error({
        context: 'AUTH-MIDDLEWARE',
        message: 'Company not found or not active',
        company,
      });
      next(
        AppException.unauthenticated({
          message: 'Unauthenticated',
        }),
      );
      return;
    }
    Logger.info({
      context: 'AUTH-MIDDLEWARE',
      message: 'Company found and is active',
      companyId: company.id,
      companyName: company.name,
      companyStatus: company.status,
    });

    // Check if sender ids exist and are active
    const senderIds: SenderIdWithSmsCenter[] = await prisma.senderId.findMany({
      where: {
        OR: validatedPayload.data.vendors.map((vendor) => ({
          id: vendor.senderId,
          status: 'active',
          smsCenter: {
            status: 'active',
          },
        })),
      },
      include: {
        smsCenter: true,
      },
    });

    // If active sender ids are not found, fail authentication
    if (!senderIds.length) {
      Logger.error({
        context: 'AUTH-MIDDLEWARE',
        message: 'Sender ids not found or not active',
        senderIds,
      });
      next(
        AppException.unauthenticated({
          message: 'Unauthenticated',
        }),
      );
      return;
    }
    Logger.info({
      context: 'AUTH-MIDDLEWARE',
      message: 'Sender ids found',
      senderIds: senderIds.map((senderId) => ({
        senderId: senderId.id,
        senderIdName: senderId.name,
        senderIdStatus: senderId.status,
        smsCenterId: senderId.smsCenter?.id,
        smsCenterStatus: senderId.smsCenter?.status,
      })),
    });

    // Attach sender ids to the request
    req.config = senderIds;

    next();
  },
);
