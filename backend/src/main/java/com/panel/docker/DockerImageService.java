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

    /**
     * The itzg/minecraft-server image uses Java-version tags (latest, java21, java17, etc.),
     * NOT Minecraft version tags. The Minecraft version is passed via the VERSION env var.
     * See https://hub.docker.com/r/itzg/minecraft-server
     */
    private static final String BASE_IMAGE = "itzg/minecraft-server";
    private static final String IMAGE_TAG = "latest";

    private final DockerClient dockerClient;

    public boolean imageExists() {
        String fullName = BASE_IMAGE + ":" + IMAGE_TAG;
        List<Image> images = dockerClient.listImagesCmd()
                .withReferenceFilter(fullName)
                .exec();
        return !images.isEmpty();
    }

    public void pullImage() throws InterruptedException {
        String fullName = BASE_IMAGE + ":" + IMAGE_TAG;
        log.info("Pulling Docker image: {}", fullName);
        dockerClient.pullImageCmd(fullName)
                .exec(new PullImageResultCallback())
                .awaitCompletion();
        log.info("Image pulled: {}", fullName);
    }

    public String getFullImageName() {
        return BASE_IMAGE + ":" + IMAGE_TAG;
    }
}
