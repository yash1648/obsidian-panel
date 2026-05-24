package com.panel.rcon;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RconCommandRequest {
    @NotBlank
    private String command;
}
