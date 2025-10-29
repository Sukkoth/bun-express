import asyncHandler from '@utils/async-handler';
import { loginUserSchema } from '@utils/validation/auth';
import validate from '@utils/validation/validate';
import * as authService from '@services/auth-service';

export const login = asyncHandler(async (req, res) => {
  const data = validate(loginUserSchema, req.body);
  const { accessToken, refreshToken } = await authService.login(data);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, message: 'Login successful', accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logout successful' });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refreshToken(refreshToken);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ success: true, message: 'Refresh successful', accessToken });
});
