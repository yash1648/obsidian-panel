package com.panel.servers;

import com.panel.console.ConsoleStreamingService;
import com.panel.docker.ContainerLifecycleService;
import com.panel.servers.config.ServerConfig;
import com.panel.servers.config.ServerConfigRepository;
import com.panel.servers.dto.CreateServerRequest;
import com.panel.servers.dto.ServerDto;
import com.panel.servers.dto.UpdateConfigRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServerService {

    private final ServerRepository serverRepository;
    private final ServerConfigRepository configRepository;
    private final ProvisioningService provisioningService;
    private final ContainerLifecycleService containerLifecycleService;
    private final ConsoleStreamingService consoleStreamingService;

    private static final Set<ServerStatus> STARTABLE = Set.of(ServerStatus.STOPPED, ServerStatus.ERROR);
    private static final Set<ServerStatus> STOPPABLE = Set.of(ServerStatus.RUNNING, ServerStatus.ERROR);
    private static final Set<ServerStatus> DELETABLE = Set.of(ServerStatus.STOPPED, ServerStatus.ERROR);

    public Page<ServerDto> findAll(String search, String status, Pageable pageable) {
        Page<Server> servers;
        if (status != null && !status.isBlank()) {
            servers = serverRepository.findByStatus(ServerStatus.valueOf(status.toUpperCase()), pageable);
        } else {
            servers = serverRepository.findAll(pageable);
        }
        return servers.map(ServerDto::fromEntity);
    }

    public ServerDto findById(UUID id) {
        Server server = getOrThrow(id);
        ServerDto dto = ServerDto.fromEntity(server);
        configRepository.findByServerId(id)
                .ifPresent(config -> dto.setConfig(ServerDto.ServerConfigDto.fromEntity(config)));
        return dto;
    }

    public ServerDto create(CreateServerRequest request) {
        if (serverRepository.findAllPorts().contains(request.getPort())) {
            throw new IllegalArgumentException("Port " + request.getPort() + " is already in use.");
        }

        Server server = Server.builder()
                .name(request.getName())
                .description(request.getDescription())
                .serverType(request.getServerType())
                .version(request.getVersion())
                .status(ServerStatus.PROVISIONING)
                .allocatedMemory(request.getAllocatedMemory())
                .allocatedCpu(request.getAllocatedCpu())
                .port(request.getPort())
                .build();

        server = serverRepository.save(server);

        // Create default config
        ServerConfig config = ServerConfig.builder()
                .serverId(server.getId())
                .motd(request.getConfig() != null ? request.getConfig().getMotd() : "A Minecraft Server")
                .maxPlayers(request.getConfig() != null ? request.getConfig().getMaxPlayers() : 20)
                .difficulty(request.getConfig() != null ? request.getConfig().getDifficulty() : "NORMAL")
                .pvpEnabled(request.getConfig() == null || request.getConfig().getPvpEnabled())
                .onlineMode(request.getConfig() == null || request.getConfig().getOnlineMode())
                .build();
        configRepository.save(config);

        // Async provisioning (Docker container creation)
        // NOTE: no @Transactional on this method — saves above commit immediately
        // so the @Async provisioning task can always find the server.
        provisioningService.provision(server.getId());

        return ServerDto.fromEntity(server);
    }

    @Transactional
    public void delete(UUID id) {
        Server server = getOrThrow(id);
        if (!DELETABLE.contains(server.getStatus())) {
            throw new IllegalStateException(
                    "Cannot delete server in " + server.getStatus() + " state. Stop it first.");
        }

        // Remove Docker container if exists
        if (server.getContainerId() != null) {
            try {
                containerLifecycleService.remove(server.getContainerId());
            } catch (Exception e) {
                log.warn("Failed to remove container for server {}: {}", id, e.getMessage());
            }
        }

        server.setStatus(ServerStatus.DELETED);
        serverRepository.save(server);
        consoleStreamingService.sendStatusUpdate(id, "DELETED");
    }

    @Transactional
    public ServerDto start(UUID id) {
        Server server = getOrThrow(id);
        if (!STARTABLE.contains(server.getStatus())) {
            throw new IllegalStateException("Cannot start server in " + server.getStatus() + " state.");
        }

        if (server.getContainerId() != null) {
            containerLifecycleService.start(server.getContainerId());
        }

        server.setStatus(ServerStatus.RUNNING);
        serverRepository.save(server);
        consoleStreamingService.sendStatusUpdate(id, "RUNNING");
        return ServerDto.fromEntity(server);
    }

    @Transactional
    public ServerDto stop(UUID id) {
        Server server = getOrThrow(id);
        if (!STOPPABLE.contains(server.getStatus())) {
            throw new IllegalStateException("Cannot stop server in " + server.getStatus() + " state.");
        }

        if (server.getContainerId() != null) {
            containerLifecycleService.stop(server.getContainerId());
        }

        server.setStatus(ServerStatus.STOPPED);
        serverRepository.save(server);
        consoleStreamingService.sendStatusUpdate(id, "STOPPED");
        return ServerDto.fromEntity(server);
    }

    @Transactional
    public ServerDto restart(UUID id) {
        Server server = getOrThrow(id);
        if (server.getStatus() != ServerStatus.RUNNING) {
            throw new IllegalStateException("Server must be running to restart.");
        }

        if (server.getContainerId() != null) {
            containerLifecycleService.restart(server.getContainerId());
        }

        consoleStreamingService.sendStatusUpdate(id, "RUNNING");
        return ServerDto.fromEntity(server);
    }

    @Transactional
    public ServerDto kill(UUID id) {
        Server server = getOrThrow(id);

        if (server.getContainerId() != null) {
            containerLifecycleService.kill(server.getContainerId());
        }

        server.setStatus(ServerStatus.ERROR);
        serverRepository.save(server);
        consoleStreamingService.sendStatusUpdate(id, "ERROR");
        return ServerDto.fromEntity(server);
    }

    @Transactional
    public void updateStatus(UUID id, ServerStatus newStatus) {
        Server server = getOrThrow(id);
        server.setStatus(newStatus);
        serverRepository.save(server);
        consoleStreamingService.sendStatusUpdate(id, newStatus.name());
    }

    public ServerConfig getConfig(UUID serverId) {
        return configRepository.findByServerId(serverId)
                .orElseThrow(() -> new RuntimeException("Config not found for server: " + serverId));
    }

    @Transactional
    public ServerDto.ServerConfigDto updateConfig(UUID serverId, UpdateConfigRequest request) {
        ServerConfig config = getConfig(serverId);

        if (request.getMotd() != null) config.setMotd(request.getMotd());
        if (request.getDifficulty() != null) config.setDifficulty(request.getDifficulty());
        if (request.getMaxPlayers() != null) config.setMaxPlayers(request.getMaxPlayers());
        if (request.getGameMode() != null) config.setGameMode(request.getGameMode());
        if (request.getPvpEnabled() != null) config.setPvpEnabled(request.getPvpEnabled());
        if (request.getOnlineMode() != null) config.setOnlineMode(request.getOnlineMode());
        if (request.getAllowFlight() != null) config.setAllowFlight(request.getAllowFlight());
        if (request.getHardcore() != null) config.setHardcore(request.getHardcore());
        if (request.getSpawnProtection() != null) config.setSpawnProtection(request.getSpawnProtection());
        if (request.getWhitelistEnabled() != null) config.setWhitelistEnabled(request.getWhitelistEnabled());
        if (request.getSpawnMonsters() != null) config.setSpawnMonsters(request.getSpawnMonsters());
        if (request.getSpawnAnimals() != null) config.setSpawnAnimals(request.getSpawnAnimals());

        return ServerDto.ServerConfigDto.fromEntity(configRepository.save(config));
    }

    public Server getOrThrow(UUID id) {
        return serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Server not found: " + id));
    }
}
