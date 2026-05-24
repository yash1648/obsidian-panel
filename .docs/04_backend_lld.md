# 04 — Backend Low-Level Design

## Package Structure

```
com.panel
│
├── auth/
│   ├── AuthController.java
│   ├── AuthService.java
│   ├── JwtTokenProvider.java
│   ├── JwtAuthFilter.java
│   ├── RefreshTokenService.java
│   └── dto/
│       ├── LoginRequest.java
│       ├── LoginResponse.java
│       └── RefreshRequest.java
│
├── users/
│   ├── UserController.java
│   ├── UserService.java
│   ├── UserRepository.java
│   ├── User.java
│   ├── Role.java (enum)
│   └── dto/
│       ├── UserDto.java
│       └── CreateUserRequest.java
│
├── servers/
│   ├── ServerController.java
│   ├── ServerService.java
│   ├── ServerRepository.java
│   ├── Server.java
│   ├── ServerStatus.java (enum)
│   ├── ServerType.java (enum)
│   ├── config/
│   │   ├── ServerConfigService.java
│   │   ├── ServerConfigRepository.java
│   │   └── ServerConfig.java
│   └── dto/
│       ├── ServerDto.java
│       ├── CreateServerRequest.java
│       └── UpdateConfigRequest.java
│
├── docker/
│   ├── DockerClientProvider.java
│   ├── ContainerCreateService.java
│   ├── ContainerLifecycleService.java
│   ├── ContainerExecService.java
│   ├── ContainerLogsService.java
│   ├── ContainerResourceService.java
│   ├── ContainerNetworkService.java
│   └── DockerImageService.java
│
├── console/
│   ├── ConsoleWebSocketHandler.java
│   ├── ConsoleStreamingService.java
│   └── ConsoleSessionRegistry.java
│
├── rcon/
│   ├── RconService.java
│   ├── RconClient.java
│   └── RconCommandRequest.java
│
├── files/
│   ├── FileManagerController.java
│   ├── FileManagerService.java
│   └── dto/
│       ├── FileEntry.java
│       └── FileUploadRequest.java
│
├── plugins/
│   ├── PluginController.java
│   ├── PluginService.java
│   ├── PluginRepository.java
│   ├── Plugin.java
│   ├── modrinth/
│   │   └── ModrinthClient.java
│   ├── curseforge/
│   │   └── CurseForgeClient.java
│   └── dto/
│       ├── PluginDto.java
│       └── InstallPluginRequest.java
│
├── backups/
│   ├── BackupController.java
│   ├── BackupService.java
│   ├── BackupRepository.java
│   ├── Backup.java
│   └── dto/
│       └── BackupDto.java
│
├── monitoring/
│   ├── MetricsController.java
│   ├── MetricsCollectorService.java
│   ├── MetricsRepository.java
│   ├── Metric.java
│   └── dto/
│       └── MetricDto.java
│
├── scheduler/
│   ├── ScheduleController.java
│   ├── ScheduleService.java
│   ├── ScheduleRepository.java
│   ├── Schedule.java
│   └── ScheduleExecutor.java
│
├── audit/
│   ├── AuditService.java
│   ├── AuditRepository.java
│   ├── AuditLog.java
│   └── AuditAspect.java          ← AOP-based automatic logging
│
├── security/
│   ├── SecurityConfig.java
│   ├── CorsConfig.java
│   ├── RateLimiter.java
│   └── FileValidationService.java
│
├── websocket/
│   ├── WebSocketConfig.java
│   └── StompEventListener.java
│
├── network/
│   ├── PortAllocationService.java
│   └── NginxConfigService.java
│
├── storage/
│   └── StorageService.java
│
└── common/
    ├── ApiResponse.java
    ├── GlobalExceptionHandler.java
    ├── PageResponse.java
    └── ValidationUtils.java
```

---

## Key Service Designs

### ServerService — State Machine

Servers follow a strict lifecycle enforced via enum transitions.

```
PROVISIONING → RUNNING
             → ERROR
RUNNING      → STOPPED
             → ERROR
STOPPED      → RUNNING
             → DELETED
ERROR        → STOPPED
             → DELETED
```

```java
public class ServerService {
    
    public ServerDto createServer(CreateServerRequest req) {
        validate(req);
        Server server = buildServerEntity(req);
        server.setStatus(ServerStatus.PROVISIONING);
        serverRepository.save(server);
        
        // Async operation
        CompletableFuture.runAsync(() -> {
            containerCreateService.provision(server);
            server.setStatus(ServerStatus.RUNNING);
            serverRepository.save(server);
        });
        
        return toDto(server);
    }
    
    public void startServer(UUID id) {
        Server server = getOrThrow(id);
        assertStatus(server, ServerStatus.STOPPED);
        containerLifecycleService.start(server.getContainerId());
        server.setStatus(ServerStatus.RUNNING);
        serverRepository.save(server);
        auditService.log("SERVER_STARTED", "Server", id);
    }
}
```

---

### ContainerCreateService — Provisioning Flow

```java
public void provision(Server server) {
    // 1. Create host directory
    Path hostPath = Paths.get("/opt/panel/servers/" + server.getUuid());
    Files.createDirectories(hostPath);

    // 2. Build container
    CreateContainerResponse container = dockerClient
        .createContainerCmd("itzg/minecraft-server")
        .withName("mc-" + server.getUuid())
        .withEnv(
            "EULA=TRUE",
            "TYPE=" + server.getServerType(),
            "VERSION=" + server.getVersion(),
            "MEMORY=" + server.getAllocatedMemory() + "M"
        )
        .withHostConfig(
            HostConfig.newHostConfig()
                .withBinds(new Bind(hostPath.toString(), new Volume("/data")))
                .withPortBindings(PortBinding.parse(server.getPort() + ":25565"))
                .withMemory((long) server.getAllocatedMemory() * 1024 * 1024)
                .withCpuPeriod(100000L)
                .withCpuQuota((long)(server.getAllocatedCpu() * 100000))
        )
        .exec();

    // 3. Persist container ID
    server.setContainerId(container.getId());
    server.setHostPath(hostPath.toString());
    serverRepository.save(server);

    // 4. Start
    dockerClient.startContainerCmd(container.getId()).exec();
}
```

---

### ConsoleStreamingService — WebSocket Log Streaming

```java
@Component
public class ConsoleStreamingService {

    public void streamLogs(String containerId, WebSocketSession session) {
        dockerClient.logContainerCmd(containerId)
            .withStdOut(true)
            .withStdErr(true)
            .withFollowStream(true)
            .withTail(100)
            .exec(new ResultCallback.Adapter<Frame>() {
                @Override
                public void onNext(Frame frame) {
                    String line = new String(frame.getPayload());
                    try {
                        session.sendMessage(new TextMessage(line));
                    } catch (IOException e) {
                        close();
                    }
                }
            });
    }
}
```

---

### RconService — In-Game Command Execution

```java
@Service
public class RconService {

    public String sendCommand(UUID serverId, String command) {
        Server server = serverService.getOrThrow(serverId);
        
        try (RconClient client = new RconClient(
                "localhost", server.getRconPort(), server.getRconPassword())) {
            client.connect();
            return client.sendCommand(command);
        }
    }
}
```

---

### AuditAspect — AOP Audit Logging

```java
@Aspect
@Component
public class AuditAspect {

    @AfterReturning("@annotation(Audited)")
    public void logAction(JoinPoint jp) {
        Audited annotation = getAnnotation(jp);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        auditService.record(AuditLog.builder()
            .userId(getUserId(auth))
            .username(auth.getName())
            .action(annotation.action())
            .entityType(annotation.entityType())
            .timestamp(LocalDateTime.now())
            .build());
    }
}
```

---

## Spring Boot Configuration

```yaml
# application.yml

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/minecraft_panel
    username: panel
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  data:
    redis:
      host: localhost
      port: 6379

docker:
  host: unix:///var/run/docker.sock
  servers:
    base-path: /opt/panel/servers

panel:
  jwt:
    secret: ${JWT_SECRET}
    access-token-expiry: 900       # 15 minutes
    refresh-token-expiry: 604800   # 7 days
  rcon:
    connection-timeout: 5000
  backup:
    base-path: /opt/panel/backups

server:
  port: 8080
```

---

## Dependencies (pom.xml highlights)

```xml
<!-- Spring Boot -->
<dependency>spring-boot-starter-web</dependency>
<dependency>spring-boot-starter-security</dependency>
<dependency>spring-boot-starter-data-jpa</dependency>
<dependency>spring-boot-starter-websocket</dependency>
<dependency>spring-boot-starter-data-redis</dependency>
<dependency>spring-boot-starter-aop</dependency>
<dependency>spring-boot-starter-validation</dependency>
<dependency>spring-boot-starter-actuator</dependency>

<!-- Docker -->
<dependency>com.github.docker-java:docker-java-core:3.3.4</dependency>
<dependency>com.github.docker-java:docker-java-transport-httpclient5:3.3.4</dependency>

<!-- JWT -->
<dependency>io.jsonwebtoken:jjwt-api:0.12.3</dependency>

<!-- DB -->
<dependency>org.postgresql:postgresql</dependency>
<dependency>org.flywaydb:flyway-core</dependency>

<!-- Monitoring -->
<dependency>io.micrometer:micrometer-registry-prometheus</dependency>
```
