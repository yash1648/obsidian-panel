-- ============================================================
-- V1: Initial Schema — Minecraft Panel
-- Creates all core tables as defined in the domain model.
-- ============================================================

-- Users
CREATE TABLE users (
    id              UUID PRIMARY KEY,
    username        VARCHAR(64)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(32)  NOT NULL DEFAULT 'VIEWER',
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMP
);

-- Servers
CREATE TABLE servers (
    id                UUID PRIMARY KEY,
    uuid              VARCHAR(36)  NOT NULL UNIQUE,
    name              VARCHAR(128) NOT NULL,
    description       TEXT,
    status            VARCHAR(32)  NOT NULL DEFAULT 'PROVISIONING',
    server_type       VARCHAR(32)  NOT NULL,
    version           VARCHAR(32)  NOT NULL,
    container_id      VARCHAR(128),
    host_path         VARCHAR(512),
    allocated_memory  INTEGER      NOT NULL,
    allocated_cpu     DECIMAL(4,2) NOT NULL,
    port              INTEGER,
    rcon_port         INTEGER,
    rcon_password     VARCHAR(64),
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP
);

CREATE INDEX idx_servers_status ON servers(status);
CREATE INDEX idx_servers_uuid   ON servers(uuid);

-- Server configs
CREATE TABLE server_configs (
    id                 UUID PRIMARY KEY,
    server_id          UUID         NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    motd               VARCHAR(255) NOT NULL DEFAULT 'A Minecraft Server',
    difficulty         VARCHAR(16)  NOT NULL DEFAULT 'NORMAL',
    max_players        INTEGER      NOT NULL DEFAULT 20,
    game_mode          VARCHAR(16)  NOT NULL DEFAULT 'SURVIVAL',
    pvp_enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
    online_mode        BOOLEAN      NOT NULL DEFAULT TRUE,
    allow_flight       BOOLEAN      NOT NULL DEFAULT FALSE,
    hardcore           BOOLEAN      NOT NULL DEFAULT FALSE,
    spawn_protection   INTEGER      NOT NULL DEFAULT 16,
    whitelist_enabled  BOOLEAN      NOT NULL DEFAULT FALSE,
    spawn_monsters     BOOLEAN      NOT NULL DEFAULT TRUE,
    spawn_animals      BOOLEAN      NOT NULL DEFAULT TRUE
);

-- Backups
CREATE TABLE backups (
    id           UUID PRIMARY KEY,
    server_id    UUID         NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    path         VARCHAR(512) NOT NULL,
    size_bytes   BIGINT,
    status       VARCHAR(16)  NOT NULL DEFAULT 'CREATING',
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_backups_server_id ON backups(server_id);

-- Plugins
CREATE TABLE plugins (
    id           UUID PRIMARY KEY,
    server_id    UUID         NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    name         VARCHAR(128) NOT NULL,
    version      VARCHAR(64)  NOT NULL,
    file_name    VARCHAR(255) NOT NULL,
    source       VARCHAR(32)  NOT NULL,
    source_id    VARCHAR(255),
    installed_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plugins_server_id ON plugins(server_id);

-- Schedules
CREATE TABLE schedules (
    id               UUID PRIMARY KEY,
    server_id        UUID         NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    cron_expression  VARCHAR(64)  NOT NULL,
    action           VARCHAR(32)  NOT NULL,
    payload          TEXT,
    enabled          BOOLEAN      NOT NULL DEFAULT TRUE,
    last_run         TIMESTAMP,
    next_run         TIMESTAMP
);

-- Audit logs
CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY,
    user_id      UUID,
    username     VARCHAR(64)  NOT NULL,
    action       VARCHAR(128) NOT NULL,
    entity_type  VARCHAR(64),
    entity_id    UUID,
    details      TEXT,
    ip_address   VARCHAR(64),
    timestamp    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id    ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp  ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_entity     ON audit_logs(entity_type, entity_id);

-- Metrics (time-series — MVP uses Postgres; replace with InfluxDB later)
CREATE TABLE metrics (
    id                UUID PRIMARY KEY,
    server_id         UUID         NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    cpu_percent       DOUBLE PRECISION,
    memory_used_mb    BIGINT,
    memory_limit_mb   BIGINT,
    tps               DOUBLE PRECISION,
    online_players    INTEGER,
    disk_used_bytes   BIGINT,
    recorded_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_metrics_server_recorded ON metrics(server_id, recorded_at DESC);
