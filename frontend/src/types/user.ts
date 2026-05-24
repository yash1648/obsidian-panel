import type { Role } from './server';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  enabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    role: Role;
  };
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: Role;
}
