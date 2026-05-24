# 09 — Deployment Architecture

## MVP — Single Node Deployment

All services run on a single Ubuntu server. Suitable for personal use, small communities, or portfolio demonstration.

### Stack

```
Ubuntu 24.04 LTS
│
├── Docker Engine           ← Runs Minecraft containers
├── PostgreSQL 16           ← Application database
├── Redis 7                 ← Cache and session store
├── Spring Boot JAR         ← Backend API (port 8080)
├── Angular (dist/)         ← Static files served by Nginx
└── Nginx                   ← Reverse proxy + SSL termination (ports 80/443)
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/panel

server {
    listen 80;
    server_name panel.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name panel.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/panel.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/panel.yourdomain.com/privkey.pem;

    # Angular SPA
    root /var/www/panel;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Spring Boot API
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_read_timeout 3600s;
    }
}
```

---

### Directory Layout

```
/opt/panel/
├── app/
│   └── panel.jar               ← Spring Boot fat JAR
├── servers/
│   └── {server-uuid}/          ← One directory per Minecraft server
├── backups/
│   └── {server-uuid}/          ← Backup archives
└── logs/
    └── panel.log               ← Application logs

/var/www/panel/                 ← Angular static files
```

---

### Systemd Service

```ini
# /etc/systemd/system/panel.service

[Unit]
Description=Minecraft Panel Backend
After=network.target postgresql.service redis.service docker.service

[Service]
Type=simple
User=panel
WorkingDirectory=/opt/panel/app
ExecStart=/usr/bin/java \
    -Xmx512m \
    -jar panel.jar \
    --spring.config.location=/opt/panel/app/application.yml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

### Required Ports

| Port | Service | Exposure |
|------|---------|----------|
| 80 | Nginx (redirect to HTTPS) | Public |
| 443 | Nginx (HTTPS) | Public |
| 8080 | Spring Boot API | Localhost only |
| 5432 | PostgreSQL | Localhost only |
| 6379 | Redis | Localhost only |
| 25565–25999 | Minecraft game ports | Public |

---

### Installation Script (bare-metal)

```bash
#!/bin/bash
# Ubuntu 24.04

# 1. Install dependencies
apt update && apt install -y openjdk-21-jre postgresql redis nginx certbot python3-certbot-nginx

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker panel

# 3. Create panel user
useradd -r -m -s /bin/bash panel

# 4. Create directories
mkdir -p /opt/panel/{app,servers,backups,logs}
chown -R panel:panel /opt/panel

# 5. Setup PostgreSQL
sudo -u postgres psql -c "CREATE USER panel WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE minecraft_panel OWNER panel;"

# 6. Deploy JAR
cp panel.jar /opt/panel/app/
cp application.yml /opt/panel/app/

# 7. Deploy frontend
cp -r dist/panel/* /var/www/panel/

# 8. Configure Nginx and SSL
certbot --nginx -d panel.yourdomain.com

# 9. Start services
systemctl daemon-reload
systemctl enable --now panel
```

---

## Production — Multi-Node Deployment

For hosting multiple servers at scale across several machines.

### Architecture

```
                      ┌──────────────────┐
                      │  Load Balancer   │
                      │  (Nginx/HAProxy) │
                      └────────┬─────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐ ┌───────▼───────┐ ┌─────▼──────────┐
    │  Panel Node 1  │ │  Panel Node 2 │ │  Panel Node 3  │
    │  Spring Boot   │ │  Spring Boot  │ │  Spring Boot   │
    └─────────┬──────┘ └───────┬───────┘ └─────┬──────────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                  ┌────────────┼────────────┐
                  │            │            │
          ┌───────▼───┐ ┌──────▼──┐ ┌──────▼──────┐
          │  Postgres │ │  Redis  │ │Shared Storage│
          │ (Primary) │ │Cluster  │ │ (NFS/S3)    │
          └───────────┘ └─────────┘ └──────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐ ┌───────▼───────┐ ┌─────▼──────────┐
    │  Worker Node 1 │ │  Worker Node 2│ │  Worker Node 3 │
    │  Docker Engine │ │  Docker Engine│ │  Docker Engine │
    │  (MC servers)  │ │  (MC servers) │ │  (MC servers)  │
    └────────────────┘ └───────────────┘ └────────────────┘
```

### Key Differences from MVP

| Concern | MVP | Production |
|---------|-----|------------|
| Panel instances | 1 | 3+ (load balanced) |
| Database | Local Postgres | Postgres with read replicas |
| Cache | Local Redis | Redis Sentinel or Cluster |
| Storage | Local disk | NFS share or object storage (S3) |
| Docker | Local socket | Remote Docker API per worker node |
| Session | Redis (already shared) | Same Redis cluster |
| SSL | Let's Encrypt | Wildcard cert or CDN |

---

## Environment Variables Reference

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=minecraft_panel
DB_USERNAME=panel
DB_PASSWORD=secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_key_at_least_256_bits

# Docker
DOCKER_HOST=unix:///var/run/docker.sock

# Panel
PANEL_SERVERS_BASE_PATH=/opt/panel/servers
PANEL_BACKUPS_BASE_PATH=/opt/panel/backups

# Optional
MODRINTH_API_KEY=your_key
CURSEFORGE_API_KEY=your_key
```
