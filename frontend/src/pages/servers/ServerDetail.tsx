import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { serversApi } from '../../api/servers';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ServerActions } from '../../components/servers/ServerActions';
import { ConsoleTerminal } from '../../components/servers/ConsoleTerminal';
import type { ServerDetail as ServerDetailType, ServerStatus, Difficulty, GameMode, ServerConfig } from '../../types/server';

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

  // Config editor state
  const [configForm, setConfigForm] = useState<ServerConfig | null>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState('');

  // File browser state
  const [files, setFiles] = useState<Array<{ name: string; type: string; size: number }>>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');

  const fetchServer = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await serversApi.getById(id);
      setServer(data);
      if (data.config) {
        setConfigForm(data.config);
      }
    } catch {
      setError('Failed to load server');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchServer();
  }, [fetchServer]);

  // File browser
  const fetchFiles = useCallback(async () => {
    if (!id) return;
    setFilesLoading(true);
    try {
      const res = await fetch(`/api/v1/servers/${id}/files?path=${encodeURIComponent(currentPath)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      const data = await res.json();
      setFiles(data.entries || []);
    } catch {
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }, [id, currentPath]);

  useEffect(() => {
    if (activeTab === 'Files' && server?.status === 'RUNNING') {
      fetchFiles();
    }
  }, [activeTab, fetchFiles, server?.status]);

  // Config save
  const handleConfigSave = async () => {
    if (!id || !configForm) return;
    setConfigSaving(true);
    setConfigMessage('');
    try {
      await serversApi.updateConfig(id, configForm as unknown as Record<string, unknown>);
      setConfigMessage('Config saved successfully');
      setTimeout(() => setConfigMessage(''), 3000);
    } catch {
      setConfigMessage('Failed to save config');
    } finally {
      setConfigSaving(false);
    }
  };

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

      {activeTab === 'Config' && configForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Edit Configuration</h3>

          {configMessage && (
            <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${
              configMessage.includes('success') ? 'bg-green-900/20 text-green-300 border border-green-600' : 'bg-red-900/20 text-red-300 border border-red-500'
            }`}>
              {configMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">MOTD</label>
              <input type="text" value={configForm.motd}
                onChange={(e) => setConfigForm({ ...configForm, motd: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Difficulty</label>
              <select value={configForm.difficulty}
                onChange={(e) => setConfigForm({ ...configForm, difficulty: e.target.value as Difficulty })}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500">
                <option value="PEACEFUL">Peaceful</option>
                <option value="EASY">Easy</option>
                <option value="NORMAL">Normal</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Max Players</label>
              <input type="number" value={configForm.maxPlayers}
                onChange={(e) => setConfigForm({ ...configForm, maxPlayers: Number(e.target.value) })}
                min={1} max={9999}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Game Mode</label>
              <select value={configForm.gameMode}
                onChange={(e) => setConfigForm({ ...configForm, gameMode: e.target.value as GameMode })}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500">
                <option value="SURVIVAL">Survival</option>
                <option value="CREATIVE">Creative</option>
                <option value="ADVENTURE">Adventure</option>
                <option value="SPECTATOR">Spectator</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Spawn Protection</label>
              <input type="number" value={configForm.spawnProtection}
                onChange={(e) => setConfigForm({ ...configForm, spawnProtection: Number(e.target.value) })}
                min={0} max={100}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {([
              ['pvpEnabled', 'PVP Enabled'],
              ['onlineMode', 'Online Mode'],
              ['allowFlight', 'Allow Flight'],
              ['hardcore', 'Hardcore'],
              ['whitelistEnabled', 'Whitelist'],
              ['spawnMonsters', 'Spawn Monsters'],
              ['spawnAnimals', 'Spawn Animals'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(configForm as unknown as Record<string, boolean>)[key]}
                  onChange={(e) => setConfigForm({ ...configForm, [key]: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600" />
                <span className="text-sm text-slate-300">{label}</span>
              </label>
            ))}
          </div>

          <button onClick={handleConfigSave} disabled={configSaving}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors">
            {configSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}

      {activeTab === 'Config' && !configForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
          Config not available.
        </div>
      )}

      {activeTab === 'Files' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-750 border-b border-slate-700">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Path:</span>
              <span className="text-slate-200 font-mono">{currentPath}</span>
            </div>
            {server.status === 'RUNNING' ? (
              <button onClick={fetchFiles} disabled={filesLoading}
                className="text-xs text-slate-400 bg-transparent border border-slate-600 px-2.5 py-1.5 rounded cursor-pointer hover:text-slate-200">
                {filesLoading ? 'Loading...' : 'Refresh'}
              </button>
            ) : (
              <span className="text-xs text-slate-500">Server must be running to browse files</span>
            )}
          </div>

          {server.status === 'RUNNING' && (
            <div className="divide-y divide-slate-700/50">
              {currentPath !== '/' && (
                <button onClick={() => setCurrentPath(currentPath.split('/').slice(0, -1).join('/') || '/')}
                  className="w-full text-left px-4 py-2.5 text-sm text-blue-400 hover:bg-slate-700/50 cursor-pointer bg-transparent border-none transition-colors">
                  📁 ..
                </button>
              )}
              {files.length === 0 && !filesLoading && (
                <div className="px-4 py-8 text-center text-slate-500 text-sm">Empty directory</div>
              )}
              {files.map((file) => (
                <div key={file.name}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span>{file.type === 'DIRECTORY' ? '📁' : '📄'}</span>
                    <span className="text-sm text-slate-300">{file.name}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {file.type === 'FILE' ? formatSize(file.size) : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {['Plugins', 'Backups', 'Monitoring', 'Players', 'Schedules'].includes(activeTab) && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
          <p className="mb-2">{activeTab} management coming in Phase 2.</p>
          <p className="text-xs">Check the roadmap at <code className="text-blue-400">.docs/10_roadmap.md</code></p>
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
