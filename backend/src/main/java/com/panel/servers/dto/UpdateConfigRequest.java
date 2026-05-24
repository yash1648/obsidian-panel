package com.panel.servers.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateConfigRequest {
    private String motd;
    private String difficulty;
    private Integer maxPlayers;
    private String gameMode;
    private Boolean pvpEnabled;
    private Boolean onlineMode;
    private Boolean allowFlight;
    private Boolean hardcore;
    private Integer spawnProtection;
    private Boolean whitelistEnabled;
    private Boolean spawnMonsters;
    private Boolean spawnAnimals;
}
