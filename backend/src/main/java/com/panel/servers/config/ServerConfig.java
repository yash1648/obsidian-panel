package com.panel.servers.config;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "server_configs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServerConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "server_id", nullable = false)
    private UUID serverId;

    @Column(nullable = false, length = 255)
    @Builder.Default
    private String motd = "A Minecraft Server";

    @Column(nullable = false, length = 16)
    @Builder.Default
    private String difficulty = "NORMAL";

    @Column(name = "max_players", nullable = false)
    @Builder.Default
    private Integer maxPlayers = 20;

    @Column(name = "game_mode", nullable = false, length = 16)
    @Builder.Default
    private String gameMode = "SURVIVAL";

    @Column(name = "pvp_enabled", nullable = false)
    @Builder.Default
    private Boolean pvpEnabled = true;

    @Column(name = "online_mode", nullable = false)
    @Builder.Default
    private Boolean onlineMode = true;

    @Column(name = "allow_flight", nullable = false)
    @Builder.Default
    private Boolean allowFlight = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean hardcore = false;

    @Column(name = "spawn_protection", nullable = false)
    @Builder.Default
    private Integer spawnProtection = 16;

    @Column(name = "whitelist_enabled", nullable = false)
    @Builder.Default
    private Boolean whitelistEnabled = false;

    @Column(name = "spawn_monsters", nullable = false)
    @Builder.Default
    private Boolean spawnMonsters = true;

    @Column(name = "spawn_animals", nullable = false)
    @Builder.Default
    private Boolean spawnAnimals = true;
}
