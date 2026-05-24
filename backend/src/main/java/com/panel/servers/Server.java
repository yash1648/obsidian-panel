package com.panel.servers;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "servers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Server {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private ServerStatus status = ServerStatus.PROVISIONING;

    @Enumerated(EnumType.STRING)
    @Column(name = "server_type", nullable = false, length = 32)
    private ServerType serverType;

    @Column(nullable = false, length = 32)
    private String version;

    @Column(name = "container_id", length = 128)
    private String containerId;

    @Column(name = "host_path", length = 512)
    private String hostPath;

    @Column(name = "allocated_memory", nullable = false)
    private Integer allocatedMemory;

    @Column(name = "allocated_cpu", nullable = false, precision = 4, scale = 2)
    private BigDecimal allocatedCpu;

    @Column
    private Integer port;

    @Column(name = "rcon_port")
    private Integer rconPort;

    @Column(name = "rcon_password", length = 64)
    private String rconPassword;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.uuid == null) {
            this.uuid = UUID.randomUUID().toString();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Map<String, String> getContainerLabels() {
        return Map.of(
                "panel.managed", "true",
                "panel.server-id", id.toString()
        );
    }
}
