# 01 — Product Vision

## Core Promise

> **"Pterodactyl Panel, built in Java/Spring with your own architecture."**

Admin can do **everything** from the browser — zero SSH required.

---

## Full Feature Set

### Server Lifecycle Management
- Create, clone, and delete Minecraft servers
- Start / Stop / Restart / Kill servers
- Crash recovery and auto-restart policies
- Server templates and snapshots

### Server Types & Versions
- Install Paper, Spigot, Fabric, Forge, Vanilla
- Change versions dynamically
- Modpack support (Phase 3)

### Resource Management
- Allocate RAM per server
- Allocate CPU shares per server
- Port management and assignment
- Storage quotas

### Configuration
- Visual `server.properties` editor
- Advanced raw config editor
- Live reload without full restart (where supported)

### Console & RCON
- Live console with xterm.js
- Send commands via RCON
- Full RCON shell interface
- Download logs

### File Management
- Full file explorer (upload, download, rename, delete)
- In-browser file editor powered by Monaco
- ZIP/unzip support
- World upload/download

### Plugin & Mod Management
- Install plugins from Modrinth, CurseForge
- Upload `.jar` files manually
- Track installed versions per server

### Player Management
- View online players
- Manage operators (`op` / `deop`)
- Manage whitelist (add / remove)
- Manage bans (ban / unban / ban-ip)

### Backups
- Create manual backups
- Restore from backup
- Download backups
- Schedule automatic backups

### Monitoring & Metrics
- CPU usage graphs
- RAM usage graphs
- TPS (ticks per second) tracking
- Disk I/O and network stats
- Alerts and thresholds

### Scheduling
- Scheduled restarts
- Scheduled commands
- Cron-style task configuration

### Network & Proxy
- Reverse proxy configuration
- SSL termination
- Multi-node host management (Phase 4)

### Administration
- Full audit trail of all actions
- Multi-user support with RBAC
- Docker image management
- System-wide resource overview

---

## Target Users

| Role | Use Case |
|------|----------|
| Super Admin | Full system control, node management |
| Admin | Server creation, resource allocation |
| Moderator | Player management, console access |
| Viewer | Read-only monitoring |
