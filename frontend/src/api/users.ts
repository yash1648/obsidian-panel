import client from './client';
import type { User, CreateUserRequest } from '../types/user';

export const usersApi = {
  list: () => client.get<User[]>('/users').then((r) => r.data),
  getById: (id: string) => client.get<User>(`/users/${id}`).then((r) => r.data),
  create: (data: CreateUserRequest) => client.post<User>('/users', data).then((r) => r.data),
  delete: (id: string) => client.delete(`/users/${id}`),
};
