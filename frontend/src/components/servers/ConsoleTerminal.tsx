import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { serversApi } from '../../api/servers';

// Import xterm CSS
import '@xterm/xterm/css/xterm.css';

interface ConsoleTerminalProps {
  serverId: string;
}

export function ConsoleTerminal({ serverId }: ConsoleTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const [command, setCommand] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!terminalRef.current || termRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#60a5fa',
        selectionBackground: '#334155',
        black: '#1e293b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e2e8f0',
      },
      rows: 20,
    });

    term.open(terminalRef.current);
    term.writeln('Connecting to console...');
    termRef.current = term;
    setConnected(true);

    return () => {
      term.dispose();
      termRef.current = null;
    };
  }, []);

  const handleSendCommand = async () => {
    if (!command.trim() || !termRef.current) return;
    const cmd = command.trim();
    termRef.current.writeln(`> ${cmd}`);
    setCommand('');

    try {
      const res = await serversApi.sendCommand(serverId, cmd);
      termRef.current.writeln(res.output || '');
    } catch {
      termRef.current.writeln('\x1b[31mCommand failed\x1b[0m');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendCommand();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs text-slate-400">
          {connected ? '● Connected' : '○ Disconnected'}
        </span>
        <button
          onClick={() => termRef.current?.clear()}
          className="text-xs text-slate-500 bg-transparent border border-slate-600 px-2 py-1 rounded cursor-pointer hover:text-slate-300"
        >
          Clear
        </button>
      </div>

      <div ref={terminalRef} className="p-2" />

      <div className="flex border-t border-slate-700">
        <span className="px-3 py-2.5 text-slate-500 text-sm font-mono">&gt;</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a command..."
          className="flex-1 px-2 py-2.5 bg-transparent text-slate-200 text-sm outline-none font-mono placeholder-slate-600"
        />
        <button
          onClick={handleSendCommand}
          disabled={!command.trim()}
          className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium cursor-pointer hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
