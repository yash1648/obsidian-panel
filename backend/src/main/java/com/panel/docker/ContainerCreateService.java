package com.panel.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.exception.DockerException;
import com.github.dockerjava.api.model.*;
import com.panel.servers.Server;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContainerCreateService {

    private final DockerClient dockerClient;
    private final DockerImageService imageService;

    @Value("${docker.servers.base-path}")
    private String serversBasePath;

    public void provision(Server server) {
        try {
            // 1. Ensure base path exists (/opt/panel/servers/…)
            Path hostPath = Paths.get(serversBasePath, server.getUuid());
            Files.createDirectories(hostPath);
            log.info("Host directory created: {}", hostPath);

            // 2. Generate RCON password
            String rconPassword = UUID.randomUUID().toString().replace("-", "").substring(0, 32);
            int rconPort = server.getPort() + 10000;

            // 3. Ensure base image is available (pull if missing)
            // NOTE: itzg/minecraft-server uses Java-version tags (latest, java21, etc.),
            // NOT Minecraft version tags. The Minecraft version is passed as VERSION env var below.
            if (!imageService.imageExists()) {
                log.info("Base image {} not found locally, pulling…", imageService.getFullImageName());
                imageService.pullImage();
            }

            // 4. Create and start the container (default bridge network — no custom network required)
            CreateContainerResponse container = dockerClient.createContainerCmd(imageService.getFullImageName())
                    .withName("mc-" + server.getUuid())
                    .withEnv(buildEnvVars(server, rconPassword))
                    .withLabels(server.getContainerLabels())
                    .withHostConfig(HostConfig.newHostConfig()
                            .withBinds(new Bind(hostPath.toString(), new Volume("/data")))
                            .withPortBindings(
                                    PortBinding.parse(server.getPort() + ":25565"),
                                    PortBinding.parse(rconPort + ":25575")
                            )
                            .withMemory((long) server.getAllocatedMemory() * 1024 * 1024)
                            .withMemorySwap((long) server.getAllocatedMemory() * 1024 * 1024)
                            .withCpuPeriod(100_000L)
                            .withCpuQuota((long) (server.getAllocatedCpu().doubleValue() * 100_000))
                            .withRestartPolicy(RestartPolicy.unlessStoppedRestart())
                    )
                    .exec();

            log.info("Container created: {} for server {}", container.getId(), server.getName());

            // 5. Update server entity
            server.setContainerId(container.getId());
            server.setHostPath(hostPath.toString());
            server.setRconPort(rconPort);
            server.setRconPassword(rconPassword);

            // 6. Start container
            dockerClient.startContainerCmd(container.getId()).exec();
            log.info("Container started: {}", container.getId());

        } catch (IOException e) {
            throw new RuntimeException("Failed to create host directory for server " + server.getName(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Image pull interrupted for server " + server.getName(), e);
        } catch (DockerException e) {
            throw new RuntimeException("Docker error provisioning server " + server.getName() + ": " + e.getMessage(), e);
        }
    }

    private List<String> buildEnvVars(Server server, String rconPassword) {
        return List.of(
                "EULA=TRUE",
                "TYPE=" + server.getServerType().name(),
                "VERSION=" + server.getVersion(),
                "MEMORY=" + server.getAllocatedMemory() + "M",
                "RCON_ENABLED=true",
                "RCON_PORT=25575",
                "RCON_PASSWORD=" + rconPassword,
                "ENABLE_ROLLING_LOGS=true",
                "TZ=UTC"
        );
    }
}
