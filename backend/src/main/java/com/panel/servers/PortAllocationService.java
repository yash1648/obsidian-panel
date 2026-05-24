package com.panel.servers;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class PortAllocationService {

    private static final int PORT_RANGE_START = 25565;
    private static final int PORT_RANGE_END = 26000;

    private final ServerRepository serverRepository;

    public int allocatePort() {
        Set<Integer> usedPorts = Set.copyOf(serverRepository.findAllPorts());
        for (int port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
            if (!usedPorts.contains(port)) {
                return port;
            }
        }
        throw new RuntimeException("No available ports in range " + PORT_RANGE_START + "-" + PORT_RANGE_END);
    }

    public int allocateRconPort(int minecraftPort) {
        return minecraftPort + 10000;
    }

    public void validatePortAvailable(int port) {
        if (serverRepository.findAllPorts().contains(port)) {
            throw new IllegalArgumentException("Port " + port + " is already in use.");
        }
    }
}
