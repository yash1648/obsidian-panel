package com.panel.servers.config;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ServerConfigRepository extends JpaRepository<ServerConfig, UUID> {
    Optional<ServerConfig> findByServerId(UUID serverId);
    void deleteByServerId(UUID serverId);
}
