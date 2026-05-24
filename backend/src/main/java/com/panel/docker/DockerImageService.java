package com.panel.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.PullImageResultCallback;
import com.github.dockerjava.api.model.Image;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DockerImageService {

    private static final String BASE_IMAGE = "itzg/minecraft-server";

    private final DockerClient dockerClient;

    public boolean imageExists(String imageTag) {
        String fullName = BASE_IMAGE + ":" + imageTag;
        List<Image> images = dockerClient.listImagesCmd()
                .withReferenceFilter(fullName)
                .exec();
        return !images.isEmpty();
    }

    public void pullImage(String imageTag) throws InterruptedException {
        String fullName = BASE_IMAGE + ":" + imageTag;
        log.info("Pulling Docker image: {}", fullName);
        dockerClient.pullImageCmd(fullName)
                .exec(new PullImageResultCallback())
                .awaitCompletion();
        log.info("Image pulled: {}", fullName);
    }

    public String getBaseImage() {
        return BASE_IMAGE;
    }
}
