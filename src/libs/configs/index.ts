/**
 * ## Environment Variables Schema Definition
 *
 * This module defines and validates the required environment variables using
 * Zod.
 *
 * Why use this?
 *
 * - Ensures all required environment variables are present at runtime
 * - Catches misconfigurations early (e.g., missing or invalid values)
 * - Applies default values where applicable (only if the variable is not set)
 * - Casts and sanitizes types (e.g., ports from string to number)
 *
 * Usage:
 *
 * - `env` is the validated and parsed version of `process.env`
 * - Use `env.APP_PORT`, `env.DB_URL`, etc., safely throughout the app
 *
 * Behavior:
 *
 * - If validation fails, the app logs the error and exits immediately
 * - If a variable is not provided but has a default, the default will be used
 *
 * Extendability:
 *
 * - You can safely add more variables (e.g., Redis, Sentry) by updating the
 *   schema
 *
 * Example:
 *
 * ```ts
 * import { env } from './env';
 * console.log(`Running on ${env.BASE_URL} in ${env.NODE_ENV} mode`);
 * ```
 */

import { z } from 'zod';
import 'dotenv/config';

export const envSchema = z.object({
  /** The environment the app is running in. */
  NODE_ENV: z
    .enum(['development', 'production', 'staging', 'test'])
    .default('development'),
  APP_PORT: z.coerce.number().int().positive().default(8000),
  /** The base URL of the app. */
  BASE_URL: z.string().url().default('http://localhost:8000'),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgres://postgres:postgres@localhost:5432/challenge_dev'),
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(10, 'JWT_SECRET must be at least 10 characters long'),

  ENCRYPTION_METHOD: z
    .string({ required_error: 'ENCRYPTION_METHOD is required' })
    .default('aes-256-cbc'),

  ENCRYPTION_KEY: z
    .string({ required_error: 'ENCRYPTION_KEY is required' })
    .min(10, 'ENCRYPTION_KEY must be at least 10 characters long'),

  ENCRYPTION_IV: z
    .string({ required_error: 'ENCRYPTION_IV is required' })
    .min(10, 'ENCRYPTION_IV must be at least 10 characters long'),

  HASH_SALT: z.coerce.number().min(10, 'HASH_SALT is required').default(10),

  BREVO_API_KEY: z.string({
    required_error: 'BREVO_API_KEY is required',
  }),

  BREVO_SENDER_EMAIL: z
    .string({
      required_error: 'BREVO_SENDER_EMAIL is required',
    })
    .email(),
});

// Validate and parse process.env at runtime
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.dir(
    {
      message: 'Invalid environment variables',
      error: parsed.error.flatten().fieldErrors,
    },
    { depth: null },
  );

  process.exit(1);
}

/**
 * @example
 *   ```ts
 *   import { env } from './env'
 *   console.log(`Running on ${env.BASE_URL} in ${env.NODE_ENV} mode`)
 *   ```
 */
export const env = parsed.data;
