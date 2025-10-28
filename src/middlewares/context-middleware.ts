import { NextFunction, Request, Response } from 'express';
import { asyncLocalStorage } from '@libs/context';
import { randomUUID } from 'crypto';

export const contextMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Use an incoming X-Request-ID header or generate a new UUID
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  const ipAddress =
    (req.headers['x-forwarded-for'] as string) ||
    req.socket.remoteAddress ||
    'UNKNOWN_IP';
  // Run the rest of the request pipeline in the context with { requestId and ip address }
  asyncLocalStorage.run({ requestId, ipAddress }, () => next());
};
