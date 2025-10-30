export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}
