package com.panel.servers.dto;

import com.panel.servers.Server;
import com.panel.servers.ServerStatus;
import com.panel.servers.ServerType;
import com.panel.servers.config.ServerConfig;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServerDto {
    private UUID id;
    private String name;
    private String description;
    private ServerType type;
    private String version;
    private ServerStatus status;
    private Integer port;
    private Integer allocatedMemory;
    private BigDecimal allocatedCpu;
    private Integer onlinePlayers;
    private LocalDateTime createdAt;

    // Detail-only fields
    private String containerId;
    private String hostPath;
    private Integer rconPort;
    private LocalDateTime updatedAt;
    private ServerConfigDto config;

    public static ServerDto fromEntity(Server server) {
        return ServerDto.builder()
                .id(server.getId())
                .name(server.getName())
                .description(server.getDescription())
                .type(server.getServerType())
                .version(server.getVersion())
                .status(server.getStatus())
                .port(server.getPort())
                .allocatedMemory(server.getAllocatedMemory())
                .allocatedCpu(server.getAllocatedCpu())
                .createdAt(server.getCreatedAt())
                .containerId(server.getContainerId())
                .hostPath(server.getHostPath())
                .rconPort(server.getRconPort())
                .updatedAt(server.getUpdatedAt())
                .build();
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ServerConfigDto {
        private String motd;
        private String difficulty;
        private Integer maxPlayers;
        private String gameMode;
        private Boolean pvpEnabled;
        private Boolean onlineMode;
        private Boolean allowFlight;
        private Boolean hardcore;
        private Integer spawnProtection;
        private Boolean whitelistEnabled;
        private Boolean spawnMonsters;
        private Boolean spawnAnimals;

        public static ServerConfigDto fromEntity(ServerConfig config) {
            if (config == null) return null;
            return ServerConfigDto.builder()
                    .motd(config.getMotd())
                    .difficulty(config.getDifficulty())
                    .maxPlayers(config.getMaxPlayers())
                    .gameMode(config.getGameMode())
                    .pvpEnabled(config.getPvpEnabled())
                    .onlineMode(config.getOnlineMode())
                    .allowFlight(config.getAllowFlight())
                    .hardcore(config.getHardcore())
                    .spawnProtection(config.getSpawnProtection())
                    .whitelistEnabled(config.getWhitelistEnabled())
                    .spawnMonsters(config.getSpawnMonsters())
                    .spawnAnimals(config.getSpawnAnimals())
                    .build();
        }
    }
}
