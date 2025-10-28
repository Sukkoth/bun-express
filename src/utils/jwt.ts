import jwt from 'jsonwebtoken';
import Logger from '@libs/logger';
import { AppException } from '@libs/exceptions/app-exception';
import { env } from '@libs/configs';
const { JWT_SECRET } = env;

// Generate a JWT for a user
export const generateToken = () => {
  return jwt.sign('', JWT_SECRET, { expiresIn: '10d' });
};

// Verify a JWT
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    Logger.error({
      context: 'JWT-VERIFY',
      message: 'Invalid or expired token',
      token,
      error,
    });
    throw AppException.unauthenticated({
      message: 'Unauthenticated',
    });
  }
};
