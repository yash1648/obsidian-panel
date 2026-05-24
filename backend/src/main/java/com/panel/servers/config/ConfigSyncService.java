package com.panel.servers.config;

import com.panel.servers.Server;
import com.panel.servers.ServerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

/**
 * Reads and writes server.properties on the container's host volume.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConfigSyncService {

    private final ServerService serverService;

    public String readProperties(UUID serverId) {
        Server server = serverService.getOrThrow(serverId);
        Path propsPath = Paths.get(server.getHostPath(), "server.properties");
        try {
            return Files.readString(propsPath);
        } catch (IOException e) {
            log.warn("Could not read server.properties for server {}: {}", serverId, e.getMessage());
            return "# server.properties not found";
        }
    }

    public void writeProperties(UUID serverId, String content) {
        Server server = serverService.getOrThrow(serverId);
        Path propsPath = Paths.get(server.getHostPath(), "server.properties");
        try {
            Files.createDirectories(propsPath.getParent());
            Files.writeString(propsPath, content);
            log.info("Written server.properties for server {}", serverId);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write server.properties", e);
        }
    }

    /**
     * Apply individual config values to server.properties on disk.
     */
    public void applyConfig(UUID serverId, ServerConfig config) {
        Server server = serverService.getOrThrow(serverId);
        Path propsPath = Paths.get(server.getHostPath(), "server.properties");

        try {
            String content = Files.exists(propsPath) ? Files.readString(propsPath) : "";
            Map<String, String> updates = configToProperties(config);

            StringBuilder sb = new StringBuilder();
            for (String line : content.split("\n")) {
                String key = line.split("=")[0].trim();
                if (updates.containsKey(key)) {
                    sb.append(key).append("=").append(updates.remove(key)).append("\n");
                } else {
                    sb.append(line).append("\n");
                }
            }
            // Append any remaining new properties
            for (Map.Entry<String, String> entry : updates.entrySet()) {
                sb.append(entry.getKey()).append("=").append(entry.getValue()).append("\n");
            }

            Files.writeString(propsPath, sb.toString());
            log.info("Applied config to server.properties for server {}", serverId);
        } catch (IOException e) {
            throw new RuntimeException("Failed to apply config to server.properties", e);
        }
    }

    private Map<String, String> configToProperties(ServerConfig config) {
        return Map.ofEntries(
                Map.entry("motd", config.getMotd()),
                Map.entry("difficulty", config.getDifficulty()),
                Map.entry("max-players", String.valueOf(config.getMaxPlayers())),
                Map.entry("gamemode", config.getGameMode().toLowerCase()),
                Map.entry("pvp", String.valueOf(config.getPvpEnabled())),
                Map.entry("online-mode", String.valueOf(config.getOnlineMode())),
                Map.entry("allow-flight", String.valueOf(config.getAllowFlight())),
                Map.entry("hardcore", String.valueOf(config.getHardcore())),
                Map.entry("spawn-protection", String.valueOf(config.getSpawnProtection())),
                Map.entry("white-list", String.valueOf(config.getWhitelistEnabled())),
                Map.entry("spawn-monsters", String.valueOf(config.getSpawnMonsters())),
                Map.entry("spawn-animals", String.valueOf(config.getSpawnAnimals()))
        );
    }
}
