# 06 — Frontend Architecture

## Stack

| Library | Purpose |
|---------|---------|
| Angular 19+ | Component framework |
| TailwindCSS | Utility-first styling |
| Angular Material | UI component library |
| RxJS | Reactive state and async data |
| xterm.js | Terminal emulator for live console |
| Monaco Editor | In-browser code/file editor |
| Chart.js | CPU, RAM, TPS metrics charts |
| STOMP.js | WebSocket/STOMP client |
| NgRx (optional) | State management for complex views |

---

## Module Structure

```
src/app/
│
├── core/
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── api.service.ts          ← HTTP base client
│   │   ├── websocket.service.ts    ← STOMP client wrapper
│   │   └── notification.service.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   ├── interceptors/
│   │   ├── jwt.interceptor.ts
│   │   └── error.interceptor.ts
│   └── models/
│       ├── server.model.ts
│       ├── user.model.ts
│       └── ...
│
├── shared/
│   ├── components/
│   │   ├── status-badge/
│   │   ├── confirm-dialog/
│   │   ├── page-header/
│   │   └── loading-spinner/
│   └── pipes/
│       ├── bytes.pipe.ts
│       └── uptime.pipe.ts
│
├── auth/
│   ├── login/
│   └── auth.routes.ts
│
├── dashboard/
│   ├── dashboard.component.ts
│   └── widgets/
│       ├── summary-cards/
│       ├── server-activity-chart/
│       └── resource-overview/
│
├── servers/
│   ├── server-list/
│   ├── server-create/              ← Multi-step wizard
│   ├── server-detail/
│   │   ├── overview/
│   │   ├── console/
│   │   ├── files/
│   │   ├── config/
│   │   ├── plugins/
│   │   ├── backups/
│   │   ├── monitoring/
│   │   ├── players/
│   │   └── schedules/
│   └── servers.routes.ts
│
├── templates/
│   ├── template-list/
│   └── template-create/
│
├── users/
│   ├── user-list/
│   └── user-edit/
│
├── audit/
│   └── audit-log/
│
└── settings/
    └── system-settings/
```

---

## UI Wireframes

### Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  🎮 Minecraft Panel          [Admin ▾]         [⚙ Settings] │
├───────────┬─────────────────────────────────────────────────┤
│           │  DASHBOARD                                       │
│ Dashboard │                                                  │
│ Servers   │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ Templates │  │ Running  │ │ Stopped  │ │  Total   │        │
│ Users     │  │    5     │ │    2     │ │    7     │        │
│ Audit     │  └──────────┘ └──────────┘ └──────────┘        │
│ Settings  │                                                  │
│           │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│           │  │ CPU Avg  │ │ RAM Used │ │ Disk Used│        │
│           │  │  34%     │ │ 12.4 GB  │ │  230 GB  │        │
│           │  └──────────┘ └──────────┘ └──────────┘        │
│           │                                                  │
│           │  [Server Activity — Line Chart]                  │
│           │  [CPU Trend — Line Chart]                        │
└───────────┴─────────────────────────────────────────────────┘
```

---

### Server List

```
┌────────────────────────────────────────────────────────────────────┐
│  SERVERS                                    [+ Create Server]       │
│  Search: [_____________]   Filter: [All ▾]                          │
├──────────────┬────────┬────────┬──────────┬───────┬──────┬─────────┤
│ Name         │ Type   │Version │ Status   │ CPU   │ RAM  │ Actions │
├──────────────┼────────┼────────┼──────────┼───────┼──────┼─────────┤
│ Survival     │ PAPER  │ 1.21.1 │ 🟢RUNNING│ 34%   │ 2.1G │ ▶ ⏹ ↺ ⋯│
│ Creative Hub │ PAPER  │ 1.21.1 │ 🟢RUNNING│ 12%   │ 1.2G │ ▶ ⏹ ↺ ⋯│
│ Modded       │ FORGE  │ 1.20.1 │ 🔴STOPPED│  0%   │  0G  │ ▶ ⏹ ↺ ⋯│
└──────────────┴────────┴────────┴──────────┴───────┴──────┴─────────┘
```

---

### Create Server Wizard

```
Step 1 of 5: Choose Type

  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Vanilla  │  │  Paper   │  │ Spigot   │  │  Fabric  │  │  Forge   │
  │    🟫    │  │   📄    │  │   🔌    │  │   🧵    │  │   ⚙     │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘

Step 2 of 5: Choose Version
  [ 1.21.1 ▾ ]

Step 3 of 5: Resources
  RAM:     [4096 MB _______________]
  CPU:     [2.0 cores ____________]
  Port:    [25565 ________________]
  Storage: [20 GB _________________]

Step 4 of 5: Server Settings
  MOTD:        [___________________]
  Difficulty:  [ NORMAL ▾ ]
  Max Players: [20]
  PVP:         [✓]
  Online Mode: [✓]
  Whitelist:   [ ]

Step 5 of 5: Review & Create
  [  ← Back  ]                  [  Create Server →  ]
```

---

### Server Detail — Tabs

```
┌──────────────────────────────────────────────────────────────────┐
│  Survival World   🟢 RUNNING   Port: 25565   Paper 1.21.1        │
│  [▶ Start] [⏹ Stop] [↺ Restart] [💀 Kill]                        │
├──────────┬─────────┬──────┬────────┬──────────┬────────┬─────────┤
│ Overview │ Console │ Files│ Config │ Plugins  │Backups │Monitoring│
├──────────┴─────────┴──────┴────────┴──────────┴────────┴─────────┤
│  (tab content renders here)                                        │
└────────────────────────────────────────────────────────────────────┘
```

---

### Console Tab

```
┌────────────────────────────────────────────────────────────┐
│  [Clear] [↓ Scroll to bottom] [⬇ Download logs]            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [12:00:01] [Server thread/INFO]: Starting Paper...   │  │
│  │ [12:00:03] [Server thread/INFO]: Done (2.1s)!        │  │
│  │ [12:01:14] [Async Chat/INFO]: <Steve> Hello!         │  │
│  │ █                                                    │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  > [say Hello world!__________________________] [Send ↵]   │
└────────────────────────────────────────────────────────────┘
```

---

### File Manager Tab

```
┌────────────────────────────────────────────────────────────────┐
│  / server root                 [📤 Upload] [📁 New Folder]      │
├──────────────────────────────┬─────────────────────────────────┤
│  📁 plugins/                 │  ← Select a file to edit        │
│  📁 world/                   │                                  │
│  📁 logs/                    │  [Monaco Editor renders here     │
│  📄 server.properties        │   when a text file is selected] │
│  📄 bukkit.yml               │                                  │
│  📄 spigot.yml               │                                  │
└──────────────────────────────┴─────────────────────────────────┘
│  Right-click menu: Edit | Rename | Download | Delete | Unzip   │
└────────────────────────────────────────────────────────────────┘
```

---

### Monitoring Tab

```
┌────────────────────────────────────────────────────────────┐
│  Range: [Last 1h ▾]              Auto-refresh: [30s ▾]     │
│                                                            │
│  CPU Usage                                                 │
│  [─────────────────────────────── Chart.js Line ──────── ] │
│                                                            │
│  Memory Usage                                              │
│  [─────────────────────────────── Chart.js Line ──────── ] │
│                                                            │
│  TPS (Ticks Per Second)                                    │
│  [─────────────────────────────── Chart.js Line ──────── ] │
│                                                            │
│  Online Players                                            │
│  [─────────────────────────────── Chart.js Area ──────── ] │
└────────────────────────────────────────────────────────────┘
```

---

## Key Angular Services

### WebSocketService

```typescript
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client: Client;

  connect(token: string): Observable<void> {
    this.client = new Client({
      brokerURL: `wss://panel.yourdomain.com/ws`,
      connectHeaders: { Authorization: `Bearer ${token}` }
    });
    return new Observable(obs => {
      this.client.onConnect = () => obs.next();
      this.client.activate();
    });
  }

  subscribeConsole(serverId: string): Observable<string> {
    return new Observable(obs => {
      this.client.subscribe(`/topic/console/${serverId}`, msg => {
        obs.next(JSON.parse(msg.body).line);
      });
    });
  }

  subscribeMetrics(serverId: string): Observable<MetricDto> {
    return new Observable(obs => {
      this.client.subscribe(`/topic/metrics/${serverId}`, msg => {
        obs.next(JSON.parse(msg.body));
      });
    });
  }
}
```

---

### ConsoleComponent

```typescript
@Component({ selector: 'app-console' })
export class ConsoleComponent implements OnInit, OnDestroy {
  private terminal: Terminal;

  ngOnInit() {
    this.terminal = new Terminal({ cursorBlink: true, theme: darkTheme });
    this.terminal.open(document.getElementById('terminal')!);

    this.wsService.subscribeConsole(this.serverId)
      .pipe(takeUntilDestroyed())
      .subscribe(line => this.terminal.writeln(line));
  }

  sendCommand() {
    this.serverService.sendCommand(this.serverId, this.commandInput)
      .subscribe();
    this.commandInput = '';
  }
}
```
