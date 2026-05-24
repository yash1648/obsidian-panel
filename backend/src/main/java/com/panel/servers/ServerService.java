package com.panel.servers;

import com.panel.servers.config.ServerConfig;
import com.panel.servers.config.ServerConfigRepository;
import com.panel.servers.dto.CreateServerRequest;
import com.panel.servers.dto.ServerDto;
import com.panel.servers.dto.UpdateConfigRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ServerService {

    private final ServerRepository serverRepository;
    private final ServerConfigRepository configRepository;

    private static final Set<ServerStatus> STARTABLE = Set.of(ServerStatus.STOPPED, ServerStatus.ERROR);
    private static final Set<ServerStatus> STOPPABLE = Set.of(ServerStatus.RUNNING, ServerStatus.ERROR);
    private static final Set<ServerStatus> DELETABLE = Set.of(ServerStatus.STOPPED, ServerStatus.ERROR);

    public Page<ServerDto> findAll(String search, String status, Pageable pageable) {
        Page<Server> servers;
        if (status != null && !status.isBlank()) {
            servers = serverRepository.findByStatus(ServerStatus.valueOf(status.toUpperCase()), pageable);
        } else if (search != null && !search.isBlank()) {
            servers = serverRepository.findAll(pageable); // filtered in controller for MVP
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

    @Transactional
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

        return ServerDto.fromEntity(server);
    }

    @Transactional
    public void delete(UUID id) {
        Server server = getOrThrow(id);
        if (!DELETABLE.contains(server.getStatus())) {
            throw new IllegalStateException(
                    "Cannot delete server in " + server.getStatus() + " state. Stop it first.");
        }
        server.setStatus(ServerStatus.DELETED);
        serverRepository.save(server);
    }

    @Transactional
    public ServerDto start(UUID id) {
        Server server = getOrThrow(id);
        if (!STARTABLE.contains(server.getStatus())) {
            throw new IllegalStateException(
                    "Cannot start server in " + server.getStatus() + " state.");
        }
        server.setStatus(ServerStatus.RUNNING);
        return ServerDto.fromEntity(serverRepository.save(server));
    }

    @Transactional
    public ServerDto stop(UUID id) {
        Server server = getOrThrow(id);
        if (!STOPPABLE.contains(server.getStatus())) {
            throw new IllegalStateException(
                    "Cannot stop server in " + server.getStatus() + " state.");
        }
        server.setStatus(ServerStatus.STOPPED);
        return ServerDto.fromEntity(serverRepository.save(server));
    }

    @Transactional
    public ServerDto restart(UUID id) {
        Server server = getOrThrow(id);
        if (server.getStatus() != ServerStatus.RUNNING) {
            throw new IllegalStateException("Server must be running to restart.");
        }
        server.setStatus(ServerStatus.STOPPED);
        serverRepository.save(server);
        server.setStatus(ServerStatus.RUNNING);
        return ServerDto.fromEntity(serverRepository.save(server));
    }

    @Transactional
    public ServerDto kill(UUID id) {
        Server server = getOrThrow(id);
        server.setStatus(ServerStatus.ERROR);
        return ServerDto.fromEntity(serverRepository.save(server));
    }

    @Transactional
    public void updateStatus(UUID id, ServerStatus newStatus) {
        Server server = getOrThrow(id);
        server.setStatus(newStatus);
        serverRepository.save(server);
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
