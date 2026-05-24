package com.panel.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.CpuStatsConfig;
import com.github.dockerjava.api.model.Statistics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.CountDownLatch;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContainerResourceService {

    private final DockerClient dockerClient;

    public ContainerStats getStats(String containerId) {
        CountDownLatch latch = new CountDownLatch(1);
        ContainerStats stats = new ContainerStats();

        dockerClient.statsCmd(containerId)
                .withNoStream(true)
                .exec(new ResultCallback.Adapter<>() {
                    @Override
                    public void onNext(Statistics statistics) {
                        stats.cpuPercent = calculateCpuPercent(statistics);
                        stats.memoryUsageMb = statistics.getMemoryStats() != null
                                ? statistics.getMemoryStats().getUsage() != null
                                ? statistics.getMemoryStats().getUsage() / (1024.0 * 1024.0)
                                : 0.0
                                : 0.0;
                        stats.memoryLimitMb = statistics.getMemoryStats() != null
                                ? statistics.getMemoryStats().getLimit() != null
                                ? statistics.getMemoryStats().getLimit() / (1024.0 * 1024.0)
                                : 0.0
                                : 0.0;
                        stats.onlineCpus = statistics.getCpuStats() != null
                                ? statistics.getCpuStats().getOnlineCpus() != null
                                ? statistics.getCpuStats().getOnlineCpus()
                                : 0
                                : 0;
                        latch.countDown();
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

        return stats;
    }

    private double calculateCpuPercent(Statistics stats) {
        if (stats.getCpuStats() == null || stats.getPreCpuStats() == null) {
            return 0.0;
        }

        CpuStatsConfig cpuStats = stats.getCpuStats();
        CpuStatsConfig preCpuStats = stats.getPreCpuStats();

        long cpuDelta = cpuStats.getCpuUsage().getTotalUsage()
                - preCpuStats.getCpuUsage().getTotalUsage();
        long systemDelta = cpuStats.getSystemCpuUsage()
                - preCpuStats.getSystemCpuUsage();

        if (systemDelta <= 0 || cpuDelta <= 0) {
            return 0.0;
        }

        long numCpus = cpuStats.getOnlineCpus() != null ? cpuStats.getOnlineCpus() : 1L;
        return (double) cpuDelta / systemDelta * numCpus * 100.0;
    }

    public static class ContainerStats {
        public double cpuPercent;
        public double memoryUsageMb;
        public double memoryLimitMb;
        public long onlineCpus;
    }
}
