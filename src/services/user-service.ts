import encryption from '@libs/encryption';
import { AppException } from '@libs/exceptions/app-exception';
import { ErrorCodes } from '@libs/exceptions/error-codes';
import Logger from '@libs/logger';
import { safeCall } from '@utils/safe-call';
import { randomUUIDv7, SQL } from 'bun';
import { User, UserRole } from '@/types';
import { ValidationException } from '@libs/exceptions/validation-exception';
import * as dbService from '@services/db-service';

export async function getUserById(id: string) {
  return await dbService.getById<User | null>(id);
}

/** Get a user via ID */
export async function getByField(args: Record<string, unknown>) {
  const data = await dbService.getByField<User | null>(
    'users',
    Object.keys(args)[0],
    Object.values(args)[0],
  );
  return data;
}

type CreateUserProps = {
  password: string;
  email: string;
  name: string;
  role?: UserRole;
};

export async function createUser(user: CreateUserProps) {
  const id = randomUUIDv7();
  const password = encryption.hash(user.password);
  const now = new Date(Date.now()); //UTC time

  const [error, data] = await safeCall(() =>
    dbService.insert<User>('users', {
      ...user,
      id,
      password,
      createdAt: now,
      updatedAt: now,
    }),
  );

  if (error) {
    Logger.error({
      message: 'Failed to create user',
      code: ErrorCodes.DB_QUERY_FAILED,
      status: 500,
      error,
    });

    if (error instanceof SQL.PostgresError) {
      /**
       * This error shows that there is a a column with the same unique field
       * (e.g. email) ,so check it and throw validation error
       */
      if (error.errno === '23505') {
        // this is postgres specific error
        const match = error.detail?.match(/Key \((\w+)\)=\(([^)]+)\) (.+)/);
        if (match) {
          const [, field, , message] = match;
          throw new ValidationException({
            message: `${field} ${message}`,
            violations: {
              [field]: [`${field} ${message}`],
            },
          });
        }
      }
    }

    throw new AppException({
      message: 'Failed to create user',
      code: ErrorCodes.DB_QUERY_FAILED,
      status: 500,
    });
  }

  Logger.info({
    message: 'User created',
    data: { ...data, password: '********' },
  });

  return data;
}

export async function updateUser(id: string | number, data: Partial<User>) {
  const [error, result] = await safeCall(() =>
    dbService.update<User>('users', id, data),
  );

  if (error) {
    Logger.error({
      message: 'Failed to update user',
      code: ErrorCodes.DB_QUERY_FAILED,
      status: 500,
      error,
    });

    throw new AppException({
      message: 'Failed to update user',
      code: ErrorCodes.DB_QUERY_FAILED,
      status: 500,
    });
  }

  Logger.info({
    message: 'User updated',
    data: { ...result, password: '********' },
  });

  return result;
}
