package com.panel.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Frame;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.Closeable;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContainerLogsService {

    private final DockerClient dockerClient;

    public void streamLogs(String containerId, Consumer<String> lineConsumer) {
        dockerClient.logContainerCmd(containerId)
                .withStdOut(true)
                .withStdErr(true)
                .withFollowStream(true)
                .withTail(200)
                .withTimestamps(false)
                .exec(new ResultCallback.Adapter<>() {
                    @Override
                    public void onNext(Frame frame) {
                        String line = new String(frame.getPayload(), StandardCharsets.UTF_8).stripTrailing();
                        lineConsumer.accept(line);
                    }
                });
    }

    public List<String> getRecentLogs(String containerId, int tail) {
        List<String> lines = new ArrayList<>();
        CountDownLatch latch = new CountDownLatch(1);

        dockerClient.logContainerCmd(containerId)
                .withStdOut(true)
                .withStdErr(true)
                .withTail(tail)
                .exec(new ResultCallback.Adapter<>() {
                    @Override
                    public void onNext(Frame frame) {
                        lines.add(new String(frame.getPayload(), StandardCharsets.UTF_8).stripTrailing());
                    }

                    @Override
                    public void onComplete() {
                        latch.countDown();
                    }

                    @Override
                    public void close() {
                        latch.countDown();
                    }
                });

        try {
            latch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return lines;
    }
}
