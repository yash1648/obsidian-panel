# 10 — Development Roadmap

## Complexity Summary

| Layer | Estimated LOC |
|-------|--------------|
| Backend (Spring Boot) | 8,000 – 15,000 |
| Frontend (Angular) | 6,000 – 12,000 |
| **Total** | **14,000 – 27,000** |

**Solo developer timeline:** 3 – 8 months  
**2-person team timeline:** 2 – 4 months

---

## Phase 1 — MVP Core

**Goal:** A working panel where you can spin up, manage, and interact with a Minecraft server.

**Duration estimate:** 4 – 6 weeks

### Backend

| Task | Priority |
|------|----------|
| Project setup (Spring Boot, Postgres, Redis, Flyway) | P0 |
| JWT auth (login, refresh, logout) | P0 |
| User entity + RBAC + security config | P0 |
| Server entity + state machine | P0 |
| Docker container create/start/stop/restart/kill | P0 |
| Volume management | P0 |
| Port allocation service | P0 |
| WebSocket config + STOMP broker | P0 |
| Console log streaming via WebSocket | P0 |
| RCON service + command endpoint | P0 |
| Config read/write (server.properties) | P0 |
| File manager (list, read, write, upload, delete) | P0 |
| Audit log (AOP) | P1 |
| Global exception handler + validation | P1 |

### Frontend

| Task | Priority |
|------|----------|
| Auth module (login page, JWT interceptor) | P0 |
| App shell (sidebar nav, header, routing) | P0 |
| Server list page | P0 |
| Create server wizard (5 steps) | P0 |
| Server detail layout (tabs) | P0 |
| Console tab (xterm.js + WebSocket) | P0 |
| Config editor tab (visual form) | P0 |
| File manager tab (tree + Monaco editor) | P0 |
| Dashboard (summary cards) | P1 |
| Status badge component | P1 |
| Confirm dialogs | P1 |

### Deliverable
> A working panel deployed on a single VPS. Create a server, start it, use the console, edit configs, manage files.

---

## Phase 2 — Operations

**Goal:** Plugin management, backups, real-time metrics, scheduling, player management.

**Duration estimate:** 4 – 6 weeks

### Backend

| Task |
|------|
| Plugin install from Modrinth API |
| Plugin install from CurseForge API |
| Plugin JAR upload + file move |
| Plugin tracking (installed list per server) |
| Backup create (tar.gz) |
| Backup restore (stop → extract → start) |
| Backup download endpoint |
| Backup scheduler (cron-based) |
| Metrics collector (Docker stats → Postgres) |
| Metrics API (time-series query) |
| Metrics WebSocket push |
| Player list via RCON |
| Op / deop / kick / ban / whitelist via RCON |
| Scheduled task engine (Spring Scheduler + cron) |

### Frontend

| Task |
|------|
| Plugin manager tab (search + install + list) |
| Backup manager tab (create / restore / download) |
| Monitoring tab (Chart.js — CPU, RAM, TPS, players) |
| Players tab (list online players + action buttons) |
| Schedules tab (create/edit/enable/disable tasks) |
| Audit log viewer page |

### Deliverable
> Full operational loop — install plugins, take backups, monitor performance, manage players, schedule restarts.

---

## Phase 3 — Templates, Modpacks & Power Features

**Goal:** Reduce toil for repeated server creation. Support modded gameplay.

**Duration estimate:** 3 – 4 weeks

### Backend

| Task |
|------|
| Server template entity + CRUD |
| Create server from template |
| Clone existing server (new UUID, copy volume) |
| Snapshot (save current state as template) |
| Modpack install via URL (CurseForge / Modrinth modpacks) |
| Advanced raw file editor (binary-safe operations) |
| World download endpoint (tar world folder) |
| World upload + swap |

### Frontend

| Task |
|------|
| Templates page (list + create + edit) |
| Clone server dialog |
| Modpack installer wizard |
| World manager (download, upload, switch) |
| Advanced config editor (raw server.properties mode) |

### Deliverable
> Create 10 servers in 2 minutes from templates. Install Fabric modpacks with one click.

---

## Phase 4 — Multi-Node & High Availability

**Goal:** Scale to multiple physical machines with centralized management.

**Duration estimate:** 6 – 10 weeks

### Backend

| Task |
|------|
| Node entity (host machine registration) |
| Remote Docker API integration per node |
| Node health monitoring |
| Server placement algorithm (assign new servers to nodes by available resources) |
| Shared storage support (NFS / S3) |
| Redis Cluster / Sentinel integration |
| PostgreSQL connection pooling (PgBouncer) |
| Horizontal panel scaling (stateless JWT) |
| WebSocket sticky sessions or Redis backplane |

### Frontend

| Task |
|------|
| Node management page |
| Node resource overview |
| Server-to-node assignment UI |
| System-wide resource view (aggregate across nodes) |

### Deliverable
> Add a second VPS, register it as a node, and deploy new servers to it from the same panel.

---

## Git Branch Strategy

```
main          ← Production-ready releases
develop       ← Integration branch
feature/*     ← Individual feature branches
hotfix/*      ← Emergency production fixes
```

## Recommended Development Order (Week by Week)

| Week | Focus |
|------|-------|
| 1 | Project setup, auth, Docker integration |
| 2 | Server CRUD, start/stop/restart, volume management |
| 3 | Console WebSocket, RCON, config read/write |
| 4 | File manager, Angular shell, server list, console UI |
| 5 | Create wizard, detail tabs, config editor UI |
| 6 | Polish MVP, deploy to VPS, smoke test |
| 7–8 | Plugin manager, backup service |
| 9–10 | Metrics, monitoring UI, player management |
| 11–12 | Scheduler, audit viewer, templates |
| 13+ | Phase 3 / Phase 4 features |

---

## Portfolio Value

This project demonstrates:

- **Spring Boot** at production scale (security, WebSocket, scheduling, AOP, Docker integration)
- **Angular** with real-time features (WebSocket, reactive forms, xterm.js, Monaco)
- **System design thinking** (state machines, service decomposition, event-driven updates)
- **DevOps awareness** (Docker, Nginx, SSL, systemd, Postgres, Redis)
- **Security consciousness** (RBAC, JWT, brute-force protection, path traversal prevention)

> This is exactly the kind of portfolio project that makes recruiters pay attention.
