import { useEffect, useState } from 'react';
import { auditApi, type AuditEntry } from '../../api/audit';
import { PageHeader } from '../../components/shared/PageHeader';

const actionColors: Record<string, string> = {
  SERVER_CREATED: 'text-green-400',
  SERVER_STARTED: 'text-green-400',
  SERVER_STOPPED: 'text-yellow-400',
  SERVER_RESTARTED: 'text-blue-400',
  SERVER_KILLED: 'text-orange-400',
  SERVER_DELETED: 'text-red-400',
  AUTH_LOGIN: 'text-blue-400',
  AUTH_LOGOUT: 'text-slate-400',
  CONFIG_UPDATED: 'text-cyan-400',
  USER_CREATED: 'text-purple-400',
};

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await auditApi.list({ page: pageNum, size: 25 });
      setEntries(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const getActionColor = (action: string) => {
    return actionColors[action] || 'text-slate-300';
  };

  return (
    <div>
      <PageHeader title="Audit Log" />

      {error && <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-2.5 rounded-lg text-sm mb-4">{error}</div>}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700">
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Entity</th>
              <th className="px-4 py-3 font-semibold">IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center text-slate-500 py-10">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-slate-500 py-10">No audit entries found.</td></tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-750 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{entry.username}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${getActionColor(entry.action)}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {entry.entityType ? `${entry.entityType}${entry.entityId ? ` (${entry.entityId.substring(0, 8)}...)` : ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 font-mono">{entry.ipAddress || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
            className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg cursor-pointer hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed border-none transition-colors">
            ← Prev
          </button>
          <span className="text-sm text-slate-500">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg cursor-pointer hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed border-none transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
