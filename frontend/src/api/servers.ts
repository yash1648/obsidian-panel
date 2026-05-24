import client from './client';
import type { Server, ServerDetail, CreateServerRequest } from '../types/server';

export const serversApi = {
  list: (params?: { page?: number; size?: number; status?: string; search?: string }) =>
    client.get<{ content: Server[]; totalElements: number; totalPages: number }>('/servers', { params }).then((r) => r.data),

  getById: (id: string) =>
    client.get<ServerDetail>(`/servers/${id}`).then((r) => r.data),

  create: (data: CreateServerRequest) =>
    client.post<Server>('/servers', data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/servers/${id}`),

  start: (id: string) =>
    client.post<Server>(`/servers/${id}/start`).then((r) => r.data),

  stop: (id: string) =>
    client.post<Server>(`/servers/${id}/stop`).then((r) => r.data),

  restart: (id: string) =>
    client.post<Server>(`/servers/${id}/restart`).then((r) => r.data),

  kill: (id: string) =>
    client.post<Server>(`/servers/${id}/kill`).then((r) => r.data),

  sendCommand: (id: string, command: string) =>
    client.post<{ output: string }>(`/servers/${id}/console/command`, { command }).then((r) => r.data),

  getConfig: (id: string) =>
    client.get(`/servers/${id}/config`).then((r) => r.data),

  updateConfig: (id: string, config: Record<string, unknown>) =>
    client.put(`/servers/${id}/config`, config).then((r) => r.data),
};
