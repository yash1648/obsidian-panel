# 07 — Docker Orchestration

## Overview

The panel uses the **docker-java** library to communicate with the Docker Engine via Unix socket. Each Minecraft server runs in its own isolated container with dedicated resource limits, volume mounts, and port bindings.

---

## Docker Client Setup

```java
@Configuration
public class DockerClientProvider {

    @Value("${docker.host}")
    private String dockerHost; // unix:///var/run/docker.sock

    @Bean
    public DockerClient dockerClient() {
        DockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder()
            .withDockerHost(dockerHost)
            .build();

        DockerHttpClient httpClient = new ApacheDockerHttpClient.Builder()
            .dockerHost(config.getDockerHost())
            .build();

        return DockerClientImpl.getInstance(config, httpClient);
    }
}
```

---

## Container Services

### ContainerCreateService

Handles the full provisioning sequence: directory creation → image pull → container creation → first start.

**Container configuration:**

```java
CreateContainerCmd cmd = dockerClient
    .createContainerCmd("itzg/minecraft-server:" + imageTag)
    .withName("mc-" + server.getUuid())
    .withEnv(buildEnvVars(server))
    .withLabels(Map.of(
        "panel.managed", "true",
        "panel.server-id", server.getId().toString()
    ))
    .withHostConfig(
        HostConfig.newHostConfig()
            // Volume mount
            .withBinds(new Bind(server.getHostPath(), new Volume("/data")))
            // Port binding
            .withPortBindings(
                PortBinding.parse(server.getPort() + ":25565"),
                PortBinding.parse(server.getRconPort() + ":25575")
            )
            // Memory limit
            .withMemory((long) server.getAllocatedMemory() * 1024 * 1024)
            .withMemorySwap((long) server.getAllocatedMemory() * 1024 * 1024) // Disable swap
            // CPU limit
            .withCpuPeriod(100_000L)
            .withCpuQuota((long)(server.getAllocatedCpu() * 100_000))
            // Restart policy
            .withRestartPolicy(RestartPolicy.unlessStoppedRestart())
            // Network
            .withNetworkMode("panel-network")
    );
```

**Environment variables passed to `itzg/minecraft-server`:**

```java
private List<String> buildEnvVars(Server server) {
    return List.of(
        "EULA=TRUE",
        "TYPE=" + server.getServerType().name(),
        "VERSION=" + server.getVersion(),
        "MEMORY=" + server.getAllocatedMemory() + "M",
        "RCON_ENABLED=true",
        "RCON_PORT=25575",
        "RCON_PASSWORD=" + server.getRconPassword(),
        "ENABLE_ROLLING_LOGS=true",
        "TZ=UTC"
    );
}
```

---

### ContainerLifecycleService

```java
@Service
public class ContainerLifecycleService {

    public void start(String containerId) {
        dockerClient.startContainerCmd(containerId).exec();
    }

    public void stop(String containerId) {
        dockerClient.stopContainerCmd(containerId)
            .withTimeout(30) // Grace period before SIGKILL
            .exec();
    }

    public void restart(String containerId) {
        dockerClient.restartContainerCmd(containerId)
            .withtTimeout(30)
            .exec();
    }

    public void kill(String containerId) {
        dockerClient.killContainerCmd(containerId)
            .withSignal("SIGKILL")
            .exec();
    }

    public void remove(String containerId) {
        dockerClient.removeContainerCmd(containerId)
            .withForce(true)
            .withRemoveVolumes(false) // Keep data volume
            .exec();
    }

    public ContainerStats getStats(String containerId) {
        // One-shot stats (non-streaming)
        StatsCallback callback = new StatsCallback();
        dockerClient.statsCmd(containerId)
            .withNoStream(true)
            .exec(callback);
        return callback.getStats();
    }
}
```

---

### ContainerLogsService

```java
@Service
public class ContainerLogsService {

    public void streamLogs(String containerId, Consumer<String> lineConsumer) {
        dockerClient.logContainerCmd(containerId)
            .withStdOut(true)
            .withStdErr(true)
            .withFollowStream(true)
            .withTail(200)
            .withTimestamps(false)
            .exec(new ResultCallback.Adapter<Frame>() {
                @Override
                public void onNext(Frame frame) {
                    lineConsumer.accept(new String(frame.getPayload()).stripTrailing());
                }
            });
    }

    public List<String> getRecentLogs(String containerId, int tail) {
        List<String> lines = new ArrayList<>();
        dockerClient.logContainerCmd(containerId)
            .withStdOut(true)
            .withStdErr(true)
            .withTail(tail)
            .exec(new ResultCallback.Adapter<Frame>() {
                @Override
                public void onNext(Frame frame) {
                    lines.add(new String(frame.getPayload()).stripTrailing());
                }
            }).awaitCompletion();
        return lines;
    }
}
```

---

## Volume Strategy

### Host Path Convention

```
/opt/panel/servers/{server-uuid}/
├── world/
├── world_nether/
├── world_the_end/
├── plugins/
├── logs/
├── server.properties
├── bukkit.yml
├── spigot.yml
└── paper-global.yml
```

### Mount

```
Container path:  /data
Host path:       /opt/panel/servers/{uuid}
Mode:            rw
```

This makes all server files directly accessible from the host for config editing, file management, and backups without going through the Docker API.

---

### Backup Strategy

```
/opt/panel/backups/{server-uuid}/
└── {timestamp}-{name}.tar.gz
```

**Backup creation:**

```java
public void createBackup(UUID serverId) {
    Server server = serverService.getOrThrow(serverId);
    String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
    String archiveName = timestamp + "-auto.tar.gz";
    Path dest = Paths.get("/opt/panel/backups/" + server.getUuid() + "/" + archiveName);
    
    // Use ProcessBuilder to tar the server directory
    ProcessBuilder pb = new ProcessBuilder(
        "tar", "-czf", dest.toString(), "-C",
        "/opt/panel/servers/" + server.getUuid(), "."
    );
    pb.start().waitFor();
    
    // Save backup record
    Backup backup = new Backup();
    backup.setServerId(serverId);
    backup.setPath(dest.toString());
    backup.setSizeBytes(Files.size(dest));
    backup.setStatus(BackupStatus.COMPLETE);
    backupRepository.save(backup);
}
```

---

## Network Architecture

### Docker Network

All managed containers share a dedicated bridge network:

```bash
docker network create panel-network --driver bridge
```

This allows future container-to-container communication (e.g., BungeeCord proxy linking to backend servers).

### Port Registry

The `PortAllocationService` maintains a table of allocated ports to prevent conflicts:

```java
@Service
public class PortAllocationService {

    private static final int PORT_RANGE_START = 25565;
    private static final int PORT_RANGE_END   = 26000;

    public int allocatePort() {
        Set<Integer> usedPorts = serverRepository.findAllPorts();
        for (int port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
            if (!usedPorts.contains(port)) return port;
        }
        throw new NoPortAvailableException("All ports in range are in use.");
    }

    public int allocateRconPort() {
        return allocatePort() + 10000; // Simple offset strategy
    }
}
```

---

## Resource Monitoring via Docker Stats

The `MetricsCollectorService` polls Docker stats every 15 seconds per running container:

```java
@Scheduled(fixedDelay = 15_000)
public void collectAllMetrics() {
    serverRepository.findAllByStatus(ServerStatus.RUNNING)
        .forEach(server -> {
            try {
                Statistics stats = getContainerStats(server.getContainerId());
                Metric metric = buildMetric(server, stats);
                metricRepository.save(metric);
                
                // Push to WebSocket subscribers
                messagingTemplate.convertAndSend(
                    "/topic/metrics/" + server.getId(),
                    toDto(metric)
                );
            } catch (Exception e) {
                log.warn("Could not collect stats for server {}", server.getId());
            }
        });
}
```

**CPU calculation from Docker stats:**

```java
double cpuDelta = stats.getCpuStats().getCpuUsage().getTotalUsage()
    - stats.getPreCpuStats().getCpuUsage().getTotalUsage();
double systemDelta = stats.getCpuStats().getSystemCpuUsage()
    - stats.getPreCpuStats().getSystemCpuUsage();
int numCpus = stats.getCpuStats().getOnlineCpus();
double cpuPercent = (cpuDelta / systemDelta) * numCpus * 100.0;
```
