package com.panel.rcon;

import com.panel.servers.Server;
import com.panel.servers.ServerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RconService {

    private final ServerService serverService;

    @Value("${panel.rcon.connection-timeout}")
    private int connectionTimeout;

    public String sendCommand(UUID serverId, String command) {
        Server server = serverService.getOrThrow(serverId);

        try (RconClient client = new RconClient(
                "localhost",
                server.getRconPort(),
                server.getRconPassword(),
                connectionTimeout
        )) {
            client.connect();
            return client.sendCommand(command);
        } catch (Exception e) {
            log.error("RCON command failed for server {}: {}", serverId, e.getMessage());
            throw new RuntimeException("Failed to send RCON command: " + e.getMessage(), e);
        }
    }
}
