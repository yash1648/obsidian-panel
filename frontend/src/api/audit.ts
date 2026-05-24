import client from './client';

export interface AuditEntry {
  id: string;
  userId: string | null;
  username: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  timestamp: string;
}

export const auditApi = {
  list: (params?: { page?: number; size?: number }) =>
    client.get<{ content: AuditEntry[]; totalElements: number; totalPages: number }>('/audit', { params }).then((r) => r.data),
};
