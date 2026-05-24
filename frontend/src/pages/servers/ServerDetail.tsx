import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { serversApi } from '../../api/servers';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ServerActions } from '../../components/servers/ServerActions';
import { ConsoleTerminal } from '../../components/servers/ConsoleTerminal';
import type { ServerDetail as ServerDetailType, ServerStatus } from '../../types/server';

const tabs = [
  'Overview', 'Console', 'Files', 'Config', 'Plugins',
  'Backups', 'Monitoring', 'Players', 'Schedules',
];

export default function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const [server, setServer] = useState<ServerDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');

  const fetchServer = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await serversApi.getById(id);
      setServer(data);
    } catch {
      setError('Failed to load server');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchServer();
  }, [fetchServer]);

  if (loading) {
    return <div className="text-center text-slate-500 py-20">Loading server...</div>;
  }

  if (error || !server) {
    return <div className="text-center text-red-400 py-20">{error || 'Server not found'}</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-100 m-0">{server.name}</h1>
            <StatusBadge status={server.status as ServerStatus} />
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>{server.type} {server.version}</span>
            <span>Port: {server.port}</span>
            <span>{server.allocatedMemory} MB RAM</span>
            {server.description && <span className="text-slate-600">— {server.description}</span>}
          </div>
        </div>
        <ServerActions serverId={server.id} status={server.status as ServerStatus} onUpdate={fetchServer} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap bg-transparent cursor-pointer border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Server Info</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">ID</dt><dd className="text-slate-300 font-mono text-xs">{server.id}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Type</dt><dd className="text-slate-300">{server.type}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Version</dt><dd className="text-slate-300">{server.version}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd className="text-slate-300"><StatusBadge status={server.status as ServerStatus} /></dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Port</dt><dd className="text-slate-300 font-mono">{server.port}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Created</dt><dd className="text-slate-300">{new Date(server.createdAt).toLocaleDateString()}</dd></div>
              </dl>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Resources</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Allocated RAM</dt><dd className="text-slate-300">{server.allocatedMemory} MB</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Allocated CPU</dt><dd className="text-slate-300">{server.allocatedCpu} cores</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">RCON Port</dt><dd className="text-slate-300 font-mono">{server.rconPort || 'N/A'}</dd></div>
                {server.containerId && <div className="flex justify-between"><dt className="text-slate-500">Container</dt><dd className="text-slate-300 font-mono text-xs">{server.containerId.substring(0, 12)}...</dd></div>}
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'Console' && (
          <ConsoleTerminal serverId={server.id} />
        )}

        {activeTab === 'Config' && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Server Configuration</h3>
            {server.config ? (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-slate-500">MOTD</dt><dd className="text-slate-300">{server.config.motd}</dd></div>
                <div><dt className="text-slate-500">Difficulty</dt><dd className="text-slate-300">{server.config.difficulty}</dd></div>
                <div><dt className="text-slate-500">Max Players</dt><dd className="text-slate-300">{server.config.maxPlayers}</dd></div>
                <div><dt className="text-slate-500">Game Mode</dt><dd className="text-slate-300">{server.config.gameMode}</dd></div>
                <div><dt className="text-slate-500">PVP</dt><dd className="text-slate-300">{server.config.pvpEnabled ? '✓ Enabled' : '✗ Disabled'}</dd></div>
                <div><dt className="text-slate-500">Online Mode</dt><dd className="text-slate-300">{server.config.onlineMode ? '✓ Enabled' : '✗ Disabled'}</dd></div>
              </dl>
            ) : (
              <p className="text-slate-500">Config not loaded.</p>
            )}
          </div>
        )}

        {activeTab === 'Files' && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
            <p>File manager will be available here.</p>
            <p className="text-xs mt-2">Upload, edit, and manage server files</p>
          </div>
        )}

        {activeTab === 'Plugins' && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
            <p>Plugin management coming in Phase 2.</p>
          </div>
        )}

        {activeTab === 'Backups' && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
            <p>Backup management coming in Phase 2.</p>
          </div>
        )}

        {activeTab === 'Monitoring' && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
            <p>Real-time metrics (CPU, RAM, TPS) coming in Phase 2.</p>
          </div>
        )}

        {activeTab === 'Players' && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
            <p>Player management coming in Phase 2.</p>
          </div>
        )}

        {activeTab === 'Schedules' && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
            <p>Scheduled tasks coming in Phase 2.</p>
          </div>
        )}
      </div>
    </div>
  );
}
