package com.panel.servers.dto;

import com.panel.servers.ServerType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreateServerRequest {

    @NotBlank @Size(max = 128)
    private String name;

    @Size(max = 2000)
    private String description;

    @NotNull
    private ServerType serverType;

    @NotBlank @Size(max = 32)
    private String version;

    @NotNull @Min(256) @Max(131072)
    private Integer allocatedMemory;

    @NotNull @DecimalMin("0.1") @DecimalMax("128.0")
    private BigDecimal allocatedCpu;

    @NotNull @Min(1024) @Max(65535)
    private Integer port;

    @Valid
    private ConfigDto config;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ConfigDto {
        @Size(max = 255)
        private String motd = "A Minecraft Server";

        @Min(1) @Max(9999)
        private Integer maxPlayers = 20;

        private String difficulty = "NORMAL";
        private Boolean pvpEnabled = true;
        private Boolean onlineMode = true;
    }
}
