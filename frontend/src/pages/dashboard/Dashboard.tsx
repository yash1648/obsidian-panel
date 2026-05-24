import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { serversApi } from '../../api/servers';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { Server, ServerStatus } from '../../types/server';

export default function Dashboard() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serversApi.list({ size: 100 })
      .then((data) => setServers(data.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const running = servers.filter((s) => s.status === 'RUNNING').length;
  const stopped = servers.filter((s) => s.status === 'STOPPED').length;
  const errored = servers.filter((s) => s.status === 'ERROR').length;
  const totalCpu = servers.reduce((sum, s) => sum + (s.status === 'RUNNING' ? Number(s.allocatedCpu) : 0), 0);
  const totalRam = servers.reduce((sum, s) => sum + (s.status === 'RUNNING' ? s.allocatedMemory : 0), 0);

  return (
    <div>
      <PageHeader title="Dashboard" />

      {loading ? (
        <div className="text-center text-slate-500 py-20">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Running</div>
              <div className="text-3xl font-bold text-green-400">{running}</div>
            </Card>
            <Card>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Stopped</div>
              <div className="text-3xl font-bold text-red-400">{stopped}</div>
            </Card>
            <Card>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total Servers</div>
              <div className="text-3xl font-bold text-slate-100">{servers.length}</div>
            </Card>
            <Card>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Errors</div>
              <div className="text-3xl font-bold text-orange-400">{errored}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total CPU Allocated (running)</div>
              <div className="text-2xl font-bold text-slate-100">{totalCpu.toFixed(1)} cores</div>
            </Card>
            <Card>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total RAM Allocated (running)</div>
              <div className="text-2xl font-bold text-slate-100">{totalRam >= 1024 ? `${(totalRam / 1024).toFixed(1)} GB` : `${totalRam} MB`}</div>
            </Card>
          </div>

          {servers.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Servers</h3>
                <Link to="/servers" className="text-xs text-blue-400 no-underline hover:text-blue-300">View All →</Link>
              </div>
              <div className="space-y-2">
                {servers.slice(0, 5).map((server) => (
                  <Link key={server.id} to={`/servers/${server.id}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-700/50 transition-colors no-underline">
                    <div>
                      <div className="text-sm font-medium text-slate-200">{server.name}</div>
                      <div className="text-xs text-slate-500">{server.type} {server.version}</div>
                    </div>
                    <StatusBadge status={server.status as ServerStatus} />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {servers.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <p className="text-slate-500 mb-4">No servers yet. Create your first Minecraft server!</p>
                <Link to="/servers/create"
                  className="inline-block py-2.5 px-5 bg-blue-600 text-white rounded-lg text-sm font-semibold no-underline hover:bg-blue-700 transition-colors">
                  + Create Server
                </Link>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
