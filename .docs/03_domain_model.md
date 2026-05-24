# 03 — Domain Model & Database Schema

## Entity Relationship Overview

```
User ──────────── AuditLog
 │
 └──── Role

Server ──────── ServerConfig
  │
  ├──── Plugin[]
  ├──── Backup[]
  ├──── Schedule[]
  ├──── AuditLog[]
  └──── Metric[]
```

---

## Core Entities

### User

```java
@Entity
public class User {
    UUID id;
    String username;
    String email;
    String passwordHash;
    Role role;               // SUPER_ADMIN | ADMIN | MODERATOR | VIEWER
    boolean enabled;
    LocalDateTime createdAt;
    LocalDateTime lastLoginAt;
}
```

**Table: `users`**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| username | VARCHAR(64) | UNIQUE NOT NULL |
| email | VARCHAR(255) | UNIQUE NOT NULL |
| password_hash | VARCHAR(255) | BCrypt |
| role | VARCHAR(32) | Enum string |
| enabled | BOOLEAN | Default true |
| created_at | TIMESTAMP | |
| last_login_at | TIMESTAMP | Nullable |

---

### Server

```java
@Entity
public class Server {
    UUID id;
    String uuid;             // Used for filesystem paths
    String name;
    String description;
    ServerStatus status;     // CREATING | RUNNING | STOPPED | ERROR | PROVISIONING
    ServerType serverType;   // VANILLA | PAPER | SPIGOT | FABRIC | FORGE
    String version;          // e.g. "1.21.1"
    String containerId;      // Docker container ID
    String hostPath;         // /opt/panel/servers/{uuid}
    Integer allocatedMemory; // MB
    Double allocatedCpu;     // CPU shares (e.g. 1.0 = 1 core)
    Integer port;            // Exposed Minecraft port
    Integer rconPort;
    String rconPassword;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
```

**Table: `servers`**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| uuid | VARCHAR(36) | UNIQUE — used in path |
| name | VARCHAR(128) | NOT NULL |
| description | TEXT | Nullable |
| status | VARCHAR(32) | Enum string |
| server_type | VARCHAR(32) | Enum string |
| version | VARCHAR(32) | e.g. `1.21.1` |
| container_id | VARCHAR(128) | Docker ID |
| host_path | VARCHAR(512) | |
| allocated_memory | INTEGER | MB |
| allocated_cpu | DECIMAL(4,2) | |
| port | INTEGER | |
| rcon_port | INTEGER | |
| rcon_password | VARCHAR(64) | Stored encrypted |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### ServerConfig

```java
@Entity
public class ServerConfig {
    UUID id;
    UUID serverId;           // FK → servers.id
    String motd;
    Difficulty difficulty;   // PEACEFUL | EASY | NORMAL | HARD
    Integer maxPlayers;
    GameMode gameMode;       // SURVIVAL | CREATIVE | ADVENTURE | SPECTATOR
    boolean pvpEnabled;
    boolean onlineMode;
    boolean allowFlight;
    boolean hardcore;
    Integer spawnProtection;
    boolean whitelistEnabled;
    boolean spawnMonsters;
    boolean spawnAnimals;
}
```

**Table: `server_configs`**

| Column | Type | Default |
|--------|------|---------|
| id | UUID PK | |
| server_id | UUID FK | NOT NULL |
| motd | VARCHAR(255) | `A Minecraft Server` |
| difficulty | VARCHAR(16) | `NORMAL` |
| max_players | INTEGER | 20 |
| game_mode | VARCHAR(16) | `SURVIVAL` |
| pvp_enabled | BOOLEAN | true |
| online_mode | BOOLEAN | true |
| allow_flight | BOOLEAN | false |
| hardcore | BOOLEAN | false |
| spawn_protection | INTEGER | 16 |
| whitelist_enabled | BOOLEAN | false |
| spawn_monsters | BOOLEAN | true |
| spawn_animals | BOOLEAN | true |

---

### Backup

```java
@Entity
public class Backup {
    UUID id;
    UUID serverId;
    String name;
    String path;             // Absolute path to .tar.gz or .zip
    Long sizeBytes;
    BackupStatus status;     // CREATING | COMPLETE | FAILED
    LocalDateTime createdAt;
}
```

**Table: `backups`**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| server_id | UUID FK | |
| name | VARCHAR(255) | |
| path | VARCHAR(512) | Backup file path |
| size_bytes | BIGINT | |
| status | VARCHAR(16) | |
| created_at | TIMESTAMP | |

---

### Plugin

```java
@Entity
public class Plugin {
    UUID id;
    UUID serverId;
    String name;
    String version;
    String fileName;         // e.g. EssentialsX-2.20.1.jar
    PluginSource source;     // MODRINTH | CURSEFORGE | UPLOAD
    String sourceId;         // ID on the source platform
    LocalDateTime installedAt;
}
```

**Table: `plugins`**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| server_id | UUID FK | |
| name | VARCHAR(128) | |
| version | VARCHAR(64) | |
| file_name | VARCHAR(255) | |
| source | VARCHAR(32) | Enum |
| source_id | VARCHAR(255) | Nullable |
| installed_at | TIMESTAMP | |

---

### Schedule

```java
@Entity
public class Schedule {
    UUID id;
    UUID serverId;
    String name;
    String cronExpression;   // e.g. "0 0 4 * * *"
    ScheduleAction action;   // RESTART | COMMAND | BACKUP
    String payload;          // Command string if action=COMMAND
    boolean enabled;
    LocalDateTime lastRun;
    LocalDateTime nextRun;
}
```

---

### AuditLog

```java
@Entity
public class AuditLog {
    UUID id;
    UUID userId;
    String username;
    String action;           // e.g. "SERVER_STARTED", "PLUGIN_INSTALLED"
    String entityType;       // "Server", "User", etc.
    UUID entityId;
    String details;          // JSON string with change details
    String ipAddress;
    LocalDateTime timestamp;
}
```

**Table: `audit_logs`**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID | Nullable for system actions |
| username | VARCHAR(64) | Snapshot at time of action |
| action | VARCHAR(128) | |
| entity_type | VARCHAR(64) | |
| entity_id | UUID | Nullable |
| details | TEXT | JSON |
| ip_address | VARCHAR(64) | |
| timestamp | TIMESTAMP | NOT NULL |

---

### Metric (Time-Series)

```java
@Entity
public class Metric {
    UUID id;
    UUID serverId;
    Double cpuPercent;
    Long memoryUsedMb;
    Long memoryLimitMb;
    Double tps;
    Integer onlinePlayers;
    Long diskUsedBytes;
    LocalDateTime recordedAt;
}
```

> **Note:** For production, replace this table with a proper time-series solution such as InfluxDB or Prometheus remote write. Postgres is acceptable for MVP.

---

## Database Indexes

```sql
-- Servers
CREATE INDEX idx_servers_status ON servers(status);
CREATE INDEX idx_servers_uuid ON servers(uuid);

-- Backups
CREATE INDEX idx_backups_server_id ON backups(server_id);

-- Plugins
CREATE INDEX idx_plugins_server_id ON plugins(server_id);

-- Audit
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- Metrics
CREATE INDEX idx_metrics_server_recorded ON metrics(server_id, recorded_at DESC);
```
