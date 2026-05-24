import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { serversApi } from '../../api/servers';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ServerActions } from '../../components/servers/ServerActions';
import { PageHeader } from '../../components/shared/PageHeader';
import type { Server, ServerStatus } from '../../types/server';

export default function ServerList() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await serversApi.list({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setServers(data.content || []);
    } catch {
      setError('Failed to load servers');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  return (
    <div>
      <PageHeader title="Servers">
        <Link
          to="/servers/create"
          className="py-2.5 px-5 bg-blue-600 text-white rounded-lg text-sm font-semibold no-underline hover:bg-blue-700 transition-colors"
        >
          + Create Server
        </Link>
      </PageHeader>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search servers..."
          className="max-w-xs w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500 placeholder-slate-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option value="RUNNING">Running</option>
          <option value="STOPPED">Stopped</option>
          <option value="ERROR">Error</option>
        </select>
      </div>

      {error && <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-2.5 rounded-lg text-sm mb-4">{error}</div>}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Version</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Port</th>
              <th className="px-4 py-3 font-semibold">RAM</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center text-slate-500 py-10">Loading...</td>
              </tr>
            ) : servers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-slate-500 py-10">
                  {search || statusFilter ? 'No servers match your filters.' : 'No servers yet. Create your first server!'}
                </td>
              </tr>
            ) : (
              servers.map((server) => (
                <tr key={server.id} className="hover:bg-slate-750 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/servers/${server.id}`} className="text-blue-400 no-underline hover:text-blue-300 font-medium">
                      {server.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{server.type}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{server.version}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={server.status as ServerStatus} />
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm font-mono">{server.port}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{server.allocatedMemory} MB</td>
                  <td className="px-4 py-3">
                    <ServerActions serverId={server.id} status={server.status as ServerStatus} onUpdate={fetchServers} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
