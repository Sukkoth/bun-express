import { Router } from 'express';
import * as authController from '@controllers/auth-controller';

const router = Router();

/**
 * Login route to get access and refresh tokens via email and password
 *
 * @function POST
 * @url auth/login
 */
router.post('/login', authController.login);

/**
 * Login route to get access and refresh tokens via refresh token
 *
 * @function POST
 * @url auth/refresh
 */
router.post('/refresh', authController.refreshToken);

/**
 * Logout route to invalidate refresh token
 *
 * @function POST
 * @url auth/logout
 */
router.post('/logout', authController.logout);

export default router;
