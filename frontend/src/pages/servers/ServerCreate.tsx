import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serversApi } from '../../api/servers';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/Card';
import type { ServerType, Difficulty, CreateServerRequest } from '../../types/server';

const serverTypes: { value: ServerType; icon: string; desc: string }[] = [
  { value: 'VANILLA', icon: '🟫', desc: 'Pure vanilla experience' },
  { value: 'PAPER', icon: '📄', desc: 'High-performance optimized' },
  { value: 'SPIGOT', icon: '🔌', desc: 'Plugin compatible' },
  { value: 'FABRIC', icon: '🧵', desc: 'Lightweight mod loader' },
  { value: 'FORGE', icon: '⚙', desc: 'Heavyweight mod loader' },
];

const versions: Record<string, string[]> = {
  VANILLA: ['1.21.4', '1.21.1', '1.20.4', '1.20.1'],
  PAPER: ['1.21.4', '1.21.1', '1.20.4', '1.20.1'],
  SPIGOT: ['1.21.1', '1.20.4', '1.20.1'],
  FABRIC: ['1.21.1', '1.20.4', '1.20.1'],
  FORGE: ['1.20.1', '1.19.4'],
};

export default function ServerCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serverType, setServerType] = useState<ServerType>('PAPER');
  const [version, setVersion] = useState('1.21.1');
  const [allocatedMemory, setAllocatedMemory] = useState(4096);
  const [allocatedCpu, setAllocatedCpu] = useState(2);
  const [port, setPort] = useState(25565);
  const [motd, setMotd] = useState('A Minecraft Server');
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [difficulty, setDifficulty] = useState('NORMAL');
  const [pvpEnabled, setPvpEnabled] = useState(true);
  const [onlineMode, setOnlineMode] = useState(true);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const request: CreateServerRequest = {
        name,
        description: description || undefined,
        serverType,
        version,
        allocatedMemory,
        allocatedCpu,
        port,
        config: { motd, maxPlayers, difficulty: difficulty as Difficulty, pvpEnabled, onlineMode },
      };
      const server = await serversApi.create(request);
      navigate(`/servers/${server.id}`);
    } catch {
      setError('Failed to create server. Port may be in use.');
    } finally {
      setLoading(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return name.trim().length > 0 && version;
    if (step === 2) return allocatedMemory >= 256 && port >= 1024;
    return true;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Create Server" />

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              s <= step ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-500'
            }`}>
              {s}
            </div>
            <span className={`text-sm ${s <= step ? 'text-slate-200' : 'text-slate-600'}`}>
              {s === 1 ? 'Type & Name' : s === 2 ? 'Resources' : 'Settings'}
            </span>
            {s < 3 && <div className="flex-1 h-px bg-slate-700" />}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-2.5 rounded-lg text-sm mb-4">{error}</div>}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Server Type & Name</h2>

          <div className="mb-4">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2 block">Server Type</label>
            <div className="grid grid-cols-5 gap-3">
              {serverTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setServerType(t.value); setVersion(versions[t.value][0]); }}
                  className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    serverType === t.value
                      ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                      : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="text-xs font-medium">{t.value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Server Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500 placeholder-slate-500"
                placeholder="My Survival World" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Version</label>
              <select value={version} onChange={(e) => setVersion(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500">
                {(versions[serverType] || []).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500 placeholder-slate-500 resize-none"
              rows={2} placeholder="What's this server for?" />
          </div>
        </Card>
      )}

      {/* Step 2: Resources */}
      {step === 2 && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Resource Allocation</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">RAM (MB)</label>
              <input type="number" value={allocatedMemory} onChange={(e) => setAllocatedMemory(Number(e.target.value))}
                min={256} max={131072} step={256}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500" />
              <span className="text-[11px] text-slate-500">{allocatedMemory >= 1024 ? `${(allocatedMemory / 1024).toFixed(1)} GB` : `${allocatedMemory} MB`}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">CPU (cores)</label>
              <input type="number" value={allocatedCpu} onChange={(e) => setAllocatedCpu(Number(e.target.value))}
                min={0.1} max={128} step={0.5}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Port</label>
            <input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))}
              min={1024} max={65535}
              className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500 max-w-xs" />
          </div>
        </Card>
      )}

      {/* Step 3: Config */}
      {step === 3 && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Server Settings</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">MOTD</label>
              <input type="text" value={motd} onChange={(e) => setMotd(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
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
              <input type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))}
                min={1} max={9999}
                className="w-full px-3.5 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={pvpEnabled} onChange={(e) => setPvpEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600" />
              <span className="text-sm text-slate-300">PVP Enabled</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={onlineMode} onChange={(e) => setOnlineMode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600" />
              <span className="text-sm text-slate-300">Online Mode</span>
            </label>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-5 py-2.5 bg-transparent text-slate-400 border border-slate-600 rounded-lg text-sm cursor-pointer hover:border-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Back
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canGoNext()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Server'}
          </button>
        )}
      </div>
    </div>
  );
}
