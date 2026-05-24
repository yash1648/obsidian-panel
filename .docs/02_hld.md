# 02 — System Architecture (High-Level Design)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Angular Admin Panel                    │
│         (Browser — REST + WebSocket via Nginx)          │
└──────────────────────────┬──────────────────────────────┘
                           │
                    REST / WebSocket
                           │
┌──────────────────────────▼──────────────────────────────┐
│              API Gateway (Spring Boot)                   │
│                  :8080 (internal)                       │
└──────────────────────────┬──────────────────────────────┘
                           │
     ┌─────────────────────┼──────────────────────┐
     │                     │                      │
     ▼                     ▼                      ▼
┌─────────┐         ┌──────────┐          ┌──────────────┐
│  Auth   │         │ Server   │          │   Console    │
│ Service │         │ Mgmt Svc │          │ Streaming Svc│
└─────────┘         └──────────┘          └──────────────┘
     │                     │                      │
     ▼                     ▼                      ▼
┌─────────┐         ┌──────────┐          ┌──────────────┐
│  Redis  │         │  Docker  │          │  RCON Svc    │
│ (Cache) │         │ Orch Svc │          └──────────────┘
└─────────┘         └──────────┘
     │                     │
     ▼                     ▼
┌──────────┐        ┌──────────────────────────────────────┐
│ Postgres │        │         Docker Engine                │
│   (DB)   │        │   ┌──────────┐  ┌──────────────┐    │
└──────────┘        │   │Minecraft │  │  Minecraft   │    │
                    │   │ Server 1 │  │  Server 2    │    │
                    │   └──────────┘  └──────────────┘    │
                    └──────────────────────────────────────┘
```

---

## Service Catalogue

| Service | Responsibility |
|---------|---------------|
| **Auth Service** | JWT issuance, refresh, brute-force protection, session management |
| **User Service** | User CRUD, role assignment, profile management |
| **Server Management Service** | Server entity CRUD, state machine, config sync |
| **Docker Orchestrator Service** | Container create/delete/inspect, resource allocation |
| **Container Lifecycle Service** | Start / stop / restart / kill operations |
| **Container Exec Service** | Command execution inside containers |
| **Container Logs Service** | Log streaming from Docker engine |
| **Config Sync Service** | Write `server.properties` to mounted volume, trigger reload |
| **File Manager Service** | Browse, upload, download, edit files in server volume |
| **Plugin Manager Service** | Modrinth/CurseForge integration, JAR upload, plugin tracking |
| **Backup Service** | Create, restore, schedule, download backups |
| **Scheduler Service** | Cron-based task execution (restarts, commands, backups) |
| **Metrics Service** | Collect CPU, RAM, TPS, disk stats per container |
| **Console Streaming Service** | WebSocket bridge from Docker log stream to browser |
| **RCON Service** | TCP RCON protocol client for live command sending |
| **Template Service** | Server template definitions, apply-on-create |
| **Audit Service** | Record all user actions with context and timestamps |
| **Network Service** | Port allocation registry, Nginx config generation |
| **Storage Service** | Disk quota enforcement, volume lifecycle |

---

## Architecture Decision: Modular Monolith

### Why NOT microservices initially?

| Concern | Monolith Advantage |
|---------|-------------------|
| Development speed | Single codebase, no inter-service networking |
| Debugging | Single log stream, single JVM to attach to |
| Deployment | One JAR, one process, one config file |
| Team size | Optimal for 1–3 engineers |
| Refactoring to microservices | Possible later via well-defined module boundaries |

The services listed above are **internal Spring modules** within a single deployable Spring Boot application — not separate processes.

---

## Data Flow: Server Creation

```
Browser (Angular)
    │ POST /api/servers
    ▼
ServerController
    │ validate + authorize
    ▼
ServerManagementService
    │ persist Server entity (PROVISIONING state)
    ▼
DockerOrchestratorService
    │ create host directory /opt/panel/servers/{uuid}
    │ pull Docker image (itzg/minecraft-server)
    │ create container with volume + port + env
    ▼
ContainerLifecycleService
    │ start container
    ▼
ConsoleStreamingService
    │ open Docker log stream → WebSocket
    ▼
Server state → RUNNING (persisted in DB)
    │
    ▼
Browser receives status update via WebSocket
```

---

## Communication Patterns

| Pattern | Used For |
|---------|----------|
| REST (HTTP/JSON) | All CRUD operations, config updates, plugin install, backup management |
| WebSocket (STOMP) | Live console streaming, real-time metrics push, server status updates |
| RCON (TCP) | In-game command execution (op, kick, ban, say, etc.) |
| Redis Pub/Sub | Internal event broadcast (server state changes) |
