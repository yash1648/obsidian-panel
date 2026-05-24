import { useState } from 'react';
import { serversApi } from '../../api/servers';
import type { ServerStatus } from '../../types/server';

interface ServerActionsProps {
  serverId: string;
  status: ServerStatus;
  onUpdate: () => void;
}

const actionButtons: Record<ServerStatus, { action: 'start' | 'stop' | 'restart' | 'kill'; label: string; color: string }[]> = {
  RUNNING: [
    { action: 'restart', label: '↺ Restart', color: 'hover:border-yellow-600 hover:text-yellow-400' },
    { action: 'stop', label: '⏹ Stop', color: 'hover:border-red-600 hover:text-red-400' },
    { action: 'kill', label: '💀 Kill', color: 'hover:border-orange-600 hover:text-orange-400' },
  ],
  STOPPED: [
    { action: 'start', label: '▶ Start', color: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' },
  ],
  ERROR: [
    { action: 'start', label: '▶ Start', color: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' },
    { action: 'kill', label: '💀 Kill', color: 'hover:border-orange-600 hover:text-orange-400' },
  ],
  PROVISIONING: [],
  DELETED: [],
};

export function ServerActions({ serverId, status, onUpdate }: ServerActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const buttons = actionButtons[status] || [];

  const handleAction = async (action: string) => {
    setLoading(action);
    setError('');
    try {
      const apiCall = {
        start: serversApi.start,
        stop: serversApi.stop,
        restart: serversApi.restart,
        kill: serversApi.kill,
      }[action];
      if (apiCall) {
        await apiCall(serverId);
        onUpdate();
      }
    } catch {
      setError(`Failed to ${action} server`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {buttons.map((btn) => (
        <button
          key={btn.action}
          onClick={() => handleAction(btn.action)}
          disabled={loading !== null}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            btn.action === 'start' ? btn.color : `bg-transparent text-slate-400 border-slate-600 ${btn.color}`
          }`}
        >
          {loading === btn.action ? '...' : btn.label}
        </button>
      ))}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}
