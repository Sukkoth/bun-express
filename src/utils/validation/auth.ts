import { UserRole, UserStatus } from '@/types';
import { z } from 'zod';

export const registerUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(6).max(100),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().jwt(),
  password: z.string().min(6).max(100),
});

export const jwtPayloadSchema = z.object({
  id: z.string().uuid(),
  role: z.nativeEnum(UserRole),
});

export const adminUpdateUserStatusSchema = z.object({
  email: z.string().email(),
  status: z.nativeEnum(UserStatus),
});

export type RegisterSchema = z.infer<typeof registerUserSchema>;

export type LoginSchema = z.infer<typeof loginUserSchema>;

export type JwtPayloadSchema = z.infer<typeof jwtPayloadSchema>;

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export type AdminUpdateUserStatusSchema = z.infer<
  typeof adminUpdateUserStatusSchema
>;
