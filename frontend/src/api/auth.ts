import client from './client';
import type { LoginRequest, LoginResponse } from '../types/user';

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    client.post<{ accessToken: string; expiresIn: number }>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    client.post('/auth/logout', { refreshToken }),
};
