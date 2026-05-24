package com.panel.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
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
            // 1. Create host directory
            Path hostPath = Paths.get(serversBasePath, server.getUuid());
            Files.createDirectories(hostPath);

            // 2. Generate RCON password
            String rconPassword = UUID.randomUUID().toString().replace("-", "").substring(0, 32);
            int rconPort = server.getPort() + 10000;

            // 3. Ensure image is available
            String imageTag = server.getVersion().toLowerCase();
            if (!imageService.imageExists(imageTag)) {
                imageService.pullImage(imageTag);
            }

            // 4. Create container
            CreateContainerResponse container = dockerClient.createContainerCmd(imageService.getBaseImage() + ":" + imageTag)
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
                            .withNetworkMode("panel-network")
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
