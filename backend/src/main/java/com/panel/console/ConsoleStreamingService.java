package com.panel.console;

import com.panel.docker.ContainerLogsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsoleStreamingService {

    private final ContainerLogsService containerLogsService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConsoleSessionRegistry sessionRegistry;

    private final ConcurrentHashMap<UUID, Boolean> activeStreams = new ConcurrentHashMap<>();

    /**
     * Start streaming Docker container logs to WebSocket subscribers.
     */
    public void startStreaming(UUID serverId, String containerId) {
        if (activeStreams.putIfAbsent(serverId, true) != null) {
            return; // Already streaming
        }

        log.info("Starting console stream for server {}", serverId);

        containerLogsService.streamLogs(containerId, line -> {
            if (sessionRegistry.hasActiveSessions(serverId)) {
                String destination = "/topic/console/" + serverId;
                String payload = String.format("{\"line\": \"%s\"}", escapeJson(line));
                messagingTemplate.convertAndSend(destination, payload);
            }
        });
    }

    /**
     * Send a single status update to subscribers.
     */
    public void sendStatusUpdate(UUID serverId, String status) {
        String destination = "/topic/status/" + serverId;
        String payload = String.format(
                "{\"serverId\": \"%s\", \"status\": \"%s\", \"timestamp\": \"%s\"}",
                serverId, status, java.time.LocalDateTime.now().toString()
        );
        messagingTemplate.convertAndSend(destination, payload);
    }

    /**
     * Send real-time metrics to subscribers.
     */
    public void sendMetrics(UUID serverId, double cpuPercent, double memoryUsedMb,
                            double memoryLimitMb, double tps, int onlinePlayers) {
        String destination = "/topic/metrics/" + serverId;
        String payload = String.format(
                "{\"serverId\": \"%s\", \"cpuPercent\": %.1f, \"memoryUsedMb\": %.0f, " +
                        "\"memoryLimitMb\": %.0f, \"tps\": %.1f, \"onlinePlayers\": %d, \"timestamp\": \"%s\"}",
                serverId, cpuPercent, memoryUsedMb, memoryLimitMb, tps, onlinePlayers,
                java.time.LocalDateTime.now().toString()
        );
        messagingTemplate.convertAndSend(destination, payload);
    }

    public void stopStreaming(UUID serverId) {
        activeStreams.remove(serverId);
        log.info("Stopped console stream for server {}", serverId);
    }

    private String escapeJson(String input) {
        return input
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
