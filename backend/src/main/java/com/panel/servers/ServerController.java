package com.panel.servers;

import com.panel.rcon.RconCommandRequest;
import com.panel.rcon.RconService;
import com.panel.servers.dto.CreateServerRequest;
import com.panel.servers.dto.ServerDto;
import com.panel.servers.dto.UpdateConfigRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/servers")
@RequiredArgsConstructor
public class ServerController {

    private final ServerService serverService;
    private final RconService rconService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VIEWER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Page<ServerDto>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return ResponseEntity.ok(serverService.findAll(search, status, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VIEWER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ServerDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(serverService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ServerDto> create(@Valid @RequestBody CreateServerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serverService.create(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        serverService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ServerDto> start(@PathVariable UUID id) {
        return ResponseEntity.ok(serverService.start(id));
    }

    @PostMapping("/{id}/stop")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ServerDto> stop(@PathVariable UUID id) {
        return ResponseEntity.ok(serverService.stop(id));
    }

    @PostMapping("/{id}/restart")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ServerDto> restart(@PathVariable UUID id) {
        return ResponseEntity.ok(serverService.restart(id));
    }

    @PostMapping("/{id}/kill")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ServerDto> kill(@PathVariable UUID id) {
        return ResponseEntity.ok(serverService.kill(id));
    }

    @PostMapping("/{id}/console/command")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> sendCommand(
            @PathVariable UUID id,
            @Valid @RequestBody RconCommandRequest request) {
        String output = rconService.sendCommand(id, request.getCommand());
        return ResponseEntity.ok(Map.of("output", output));
    }

    @GetMapping("/{id}/config")
    @PreAuthorize("hasAnyRole('VIEWER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ServerDto.ServerConfigDto> getConfig(@PathVariable UUID id) {
        serverService.getOrThrow(id);
        return ResponseEntity.ok(ServerDto.ServerConfigDto.fromEntity(serverService.getConfig(id)));
    }

    @PutMapping("/{id}/config")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ServerDto.ServerConfigDto> updateConfig(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateConfigRequest request) {
        return ResponseEntity.ok(serverService.updateConfig(id, request));
    }
}
