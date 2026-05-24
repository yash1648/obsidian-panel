# 05 — API Contracts

**Base URL:** `https://panel.yourdomain.com/api/v1`

**Authentication:** All endpoints (except `/auth/**`) require:
```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST `/auth/login`

**Request:**
```json
{
  "username": "admin",
  "password": "securepassword"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "dGhpcyBpcyBh...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "SUPER_ADMIN"
  }
}
```

---

### POST `/auth/refresh`

**Request:**
```json
{ "refreshToken": "dGhpcyBpcyBh..." }
```

**Response 200:**
```json
{ "accessToken": "eyJhbGci...", "expiresIn": 900 }
```

---

### POST `/auth/logout`

Invalidates refresh token server-side. Response: `204 No Content`

---

## Server Endpoints

### GET `/servers`

Returns paginated list of all servers.

**Query params:** `page`, `size`, `status`, `search`

**Response 200:**
```json
{
  "content": [
    {
      "id": "uuid",
      "name": "Survival World",
      "type": "PAPER",
      "version": "1.21.1",
      "status": "RUNNING",
      "port": 25565,
      "allocatedMemory": 4096,
      "allocatedCpu": 2.0,
      "onlinePlayers": 5,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "totalElements": 12,
  "totalPages": 2,
  "page": 0,
  "size": 10
}
```

---

### POST `/servers`

**Request:**
```json
{
  "name": "Survival World",
  "description": "Main survival server",
  "serverType": "PAPER",
  "version": "1.21.1",
  "allocatedMemory": 4096,
  "allocatedCpu": 2.0,
  "port": 25565,
  "config": {
    "motd": "Welcome!",
    "maxPlayers": 20,
    "difficulty": "NORMAL",
    "pvpEnabled": true,
    "onlineMode": true
  }
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "status": "PROVISIONING",
  ...
}
```

---

### GET `/servers/{id}`

Returns full server detail including config.

---

### DELETE `/servers/{id}`

Stops container, removes volume, deletes DB records.
Response: `204 No Content`

---

## Server Lifecycle Endpoints

### POST `/servers/{id}/start`

Response: `200` with updated server status.

### POST `/servers/{id}/stop`

Response: `200` with updated server status.

### POST `/servers/{id}/restart`

Response: `200`

### POST `/servers/{id}/kill`

Force kills the container. Response: `200`

---

## Config Endpoints

### GET `/servers/{id}/config`

Returns current `ServerConfig`.

### PUT `/servers/{id}/config`

**Request:**
```json
{
  "motd": "Updated MOTD",
  "maxPlayers": 30,
  "difficulty": "HARD",
  "pvpEnabled": false,
  "onlineMode": true,
  "allowFlight": false,
  "hardcore": false,
  "spawnProtection": 16,
  "whitelistEnabled": true
}
```

Response: `200` with updated config. Writes `server.properties` to volume.

---

## Console Endpoints

### POST `/servers/{id}/console/command`

Send a command via RCON.

**Request:**
```json
{ "command": "say Hello!" }
```

**Response 200:**
```json
{ "output": "Say: Hello!" }
```

---

## WebSocket — Console Streaming

**Endpoint:** `ws://panel.yourdomain.com/ws`  
**Protocol:** STOMP

### Subscribe to live console

```
SUBSCRIBE /topic/console/{serverId}
```

**Messages received:**
```json
{ "line": "[12:01:45] [Server thread/INFO]: Done (2.445s)!" }
```

### Subscribe to server status updates

```
SUBSCRIBE /topic/status/{serverId}
```

**Messages received:**
```json
{ "serverId": "uuid", "status": "RUNNING", "timestamp": "..." }
```

### Subscribe to metrics

```
SUBSCRIBE /topic/metrics/{serverId}
```

**Messages received:**
```json
{
  "serverId": "uuid",
  "cpuPercent": 23.4,
  "memoryUsedMb": 1820,
  "memoryLimitMb": 4096,
  "tps": 19.8,
  "onlinePlayers": 5,
  "timestamp": "..."
}
```

---

## File Manager Endpoints

### GET `/servers/{id}/files?path=/`

**Response:**
```json
{
  "path": "/",
  "entries": [
    { "name": "server.properties", "type": "FILE", "size": 1024, "modified": "..." },
    { "name": "plugins", "type": "DIRECTORY", "modified": "..." }
  ]
}
```

### GET `/servers/{id}/files/content?path=/server.properties`

Returns raw file content as text.

### PUT `/servers/{id}/files/content`

**Request:**
```json
{
  "path": "/server.properties",
  "content": "# Updated content\nmax-players=30\n..."
}
```

### POST `/servers/{id}/files/upload?path=/plugins`

`multipart/form-data` — uploads file to specified directory.

### DELETE `/servers/{id}/files?path=/old-plugin.jar`

### POST `/servers/{id}/files/mkdir`

```json
{ "path": "/my-new-folder" }
```

### POST `/servers/{id}/files/rename`

```json
{ "from": "/old-name.txt", "to": "/new-name.txt" }
```

---

## Plugin Endpoints

### GET `/servers/{id}/plugins`

Returns list of installed plugins.

### POST `/servers/{id}/plugins/install`

**Request (from Modrinth):**
```json
{
  "source": "MODRINTH",
  "sourceId": "essentialsx",
  "version": "2.21.0"
}
```

**Request (upload):**

`multipart/form-data` with file.

### DELETE `/servers/{id}/plugins/{pluginId}`

---

## Backup Endpoints

### GET `/servers/{id}/backups`

### POST `/servers/{id}/backups`

Triggers an immediate backup. Response: `202 Accepted`

### POST `/servers/{id}/backups/{backupId}/restore`

Stops server, restores volume, restarts. Response: `202 Accepted`

### GET `/servers/{id}/backups/{backupId}/download`

Returns file as `application/octet-stream`.

### DELETE `/servers/{id}/backups/{backupId}`

---

## Player Management Endpoints

### GET `/servers/{id}/players`

Returns online players from RCON.

```json
{
  "online": 3,
  "max": 20,
  "players": ["Steve", "Alex", "Notch"]
}
```

### POST `/servers/{id}/players/{name}/op`
### DELETE `/servers/{id}/players/{name}/op`
### POST `/servers/{id}/players/{name}/kick`

**Request:**
```json
{ "reason": "Breaking rules" }
```

### POST `/servers/{id}/players/{name}/ban`
### DELETE `/servers/{id}/players/{name}/ban`
### POST `/servers/{id}/players/{name}/whitelist`
### DELETE `/servers/{id}/players/{name}/whitelist`

---

## Monitoring Endpoints

### GET `/servers/{id}/metrics`

**Query params:** `from`, `to` (ISO timestamps), `resolution` (`1m` | `5m` | `1h`)

**Response:**
```json
{
  "serverId": "uuid",
  "from": "2025-01-01T00:00:00Z",
  "to": "2025-01-01T01:00:00Z",
  "series": {
    "cpu": [{ "time": "...", "value": 23.4 }],
    "memory": [{ "time": "...", "value": 1820 }],
    "tps": [{ "time": "...", "value": 19.8 }]
  }
}
```

---

## Standard Error Responses

```json
{
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Port 25565 is already in use.",
  "path": "/api/v1/servers",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Insufficient role |
| 404 | Resource not found |
| 409 | Conflict (port in use, server already running) |
| 500 | Internal server error |
