package com.panel.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateNetworkResponse;
import com.github.dockerjava.api.model.Network;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContainerNetworkService {

    private static final String PANEL_NETWORK = "panel-network";

    private final DockerClient dockerClient;

    public void ensureNetworkExists() {
        List<Network> networks = dockerClient.listNetworksCmd()
                .withNameFilter(PANEL_NETWORK)
                .exec();

        if (networks.isEmpty()) {
            CreateNetworkResponse response = dockerClient.createNetworkCmd()
                    .withName(PANEL_NETWORK)
                    .withDriver("bridge")
                    .exec();
            log.info("Created Docker network: {} ({})", PANEL_NETWORK, response.getId());
        }
    }

    public void connectToNetwork(String containerId) {
        dockerClient.connectToNetworkCmd()
                .withContainerId(containerId)
                .withNetworkId(PANEL_NETWORK)
                .exec();
    }

    public void disconnectFromNetwork(String containerId) {
        dockerClient.disconnectFromNetworkCmd()
                .withContainerId(containerId)
                .withNetworkId(PANEL_NETWORK)
                .exec();
    }
}
