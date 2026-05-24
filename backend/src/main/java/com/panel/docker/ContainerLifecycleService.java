package com.panel.docker;

import com.github.dockerjava.api.DockerClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContainerLifecycleService {

    private final DockerClient dockerClient;

    public void start(String containerId) {
        dockerClient.startContainerCmd(containerId).exec();
        log.info("Container started: {}", containerId);
    }

    public void stop(String containerId) {
        dockerClient.stopContainerCmd(containerId)
                .withTimeout(30)
                .exec();
        log.info("Container stopped: {}", containerId);
    }

    public void restart(String containerId) {
        dockerClient.restartContainerCmd(containerId)
                .withtTimeout(30)
                .exec();
        log.info("Container restarted: {}", containerId);
    }

    public void kill(String containerId) {
        dockerClient.killContainerCmd(containerId)
                .withSignal("SIGKILL")
                .exec();
        log.info("Container killed: {}", containerId);
    }

    public void remove(String containerId) {
        dockerClient.removeContainerCmd(containerId)
                .withForce(true)
                .withRemoveVolumes(false)
                .exec();
        log.info("Container removed (volumes preserved): {}", containerId);
    }

    public boolean isRunning(String containerId) {
        try {
            var inspect = dockerClient.inspectContainerCmd(containerId).exec();
            return inspect.getState().getRunning();
        } catch (Exception e) {
            log.warn("Failed to inspect container {}: {}", containerId, e.getMessage());
            return false;
        }
    }
}
