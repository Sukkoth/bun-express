import jwt, { SignOptions } from 'jsonwebtoken';
import Logger from '@libs/logger';
import { AppException } from '@libs/exceptions/app-exception';
import { env } from '@libs/configs';
const { JWT_SECRET } = env;

// Generate a JWT for a user
export const generateToken = ({
  payload,
  expiresIn,
}: {
  payload: Record<string, unknown>;
  expiresIn: SignOptions['expiresIn'];
}) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Verify a JWT
export const verifyToken = <T>(token: string): T => {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    Logger.error({
      context: 'JWT-VERIFY',
      message: 'Invalid or expired token',
      token,
    });
    throw AppException.unauthenticated();
  }
};
