import { UserRole } from '@/types';
import { z } from 'zod';

const registerUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(6).max(100),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
});

const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

type RegisterSchema = z.infer<typeof registerUserSchema>;

type LoginSchema = z.infer<typeof loginUserSchema>;

export { registerUserSchema, loginUserSchema, RegisterSchema, LoginSchema };
