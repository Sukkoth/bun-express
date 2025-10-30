import { User } from '@types';

declare global {
  namespace Express {
    interface Request {
      /** Authenticated user info */
      user?: User;
    }
  }
}
