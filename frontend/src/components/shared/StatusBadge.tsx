import type { ServerStatus } from '../../types/server';

const statusConfig: Record<ServerStatus, { color: string; label: string }> = {
  RUNNING: { color: 'bg-green-500', label: 'Running' },
  STOPPED: { color: 'bg-red-500', label: 'Stopped' },
  PROVISIONING: { color: 'bg-yellow-500 animate-pulse', label: 'Provisioning' },
  ERROR: { color: 'bg-orange-500', label: 'Error' },
  DELETED: { color: 'bg-slate-500', label: 'Deleted' },
};

interface StatusBadgeProps {
  status: ServerStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { color: 'bg-slate-500', label: status };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/50">
      <span className={`w-2 h-2 rounded-full ${config.color}`} />
      {config.label}
    </span>
  );
}
