package com.panel.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.ExecCreateCmdResponse;
import com.github.dockerjava.api.model.StreamType;
import com.github.dockerjava.core.command.ExecStartResultCallback;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContainerExecService {

    private final DockerClient dockerClient;

    public String executeCommand(String containerId, String... command) {
        ExecCreateCmdResponse execCreate = dockerClient.execCreateCmd(containerId)
                .withAttachStdout(true)
                .withAttachStderr(true)
                .withCmd(command)
                .exec();

        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        ByteArrayOutputStream stderr = new ByteArrayOutputStream();

        try {
            dockerClient.execStartCmd(execCreate.getId())
                    .exec(new ExecStartResultCallback(stdout, stderr))
                    .awaitCompletion();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Command execution interrupted", e);
        }

        String output = stdout.toString(StandardCharsets.UTF_8).trim();
        if (!output.isEmpty()) {
            return output;
        }
        return stderr.toString(StandardCharsets.UTF_8).trim();
    }

    public String executeRconCommand(String containerId, String rconPassword, String command) {
        return executeCommand(containerId,
                "rcon-cli", "--password", rconPassword, "--port", "25575", command);
    }
}
