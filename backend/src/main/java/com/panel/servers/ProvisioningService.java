package com.panel.servers;

import com.panel.console.ConsoleStreamingService;
import com.panel.docker.ContainerCreateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProvisioningService {

    private final ServerRepository serverRepository;
    private final ContainerCreateService containerCreateService;
    private final ConsoleStreamingService consoleStreamingService;

    @Async
    @Transactional
    public void provision(UUID serverId) {
        try {
            Server server = serverRepository.findById(serverId)
                    .orElseThrow(() -> new RuntimeException("Server not found: " + serverId));

            containerCreateService.provision(server);
            server.setStatus(ServerStatus.RUNNING);
            serverRepository.save(server);

            consoleStreamingService.sendStatusUpdate(serverId, "RUNNING");
            log.info("Server {} provisioned and running", serverId);

        } catch (Exception e) {
            log.error("Failed to provision server {}: {}", serverId, e.getMessage(), e);
            try {
                Server failedServer = serverRepository.findById(serverId).orElse(null);
                if (failedServer != null) {
                    failedServer.setStatus(ServerStatus.ERROR);
                    serverRepository.save(failedServer);
                    consoleStreamingService.sendStatusUpdate(serverId, "ERROR");
                }
            } catch (Exception ex) {
                log.error("Failed to update server {} to ERROR state", serverId, ex);
            }
        }
    }
}
