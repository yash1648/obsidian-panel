package com.panel.files;

import com.panel.files.dto.FileEntry;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/servers/{id}/files")
@RequiredArgsConstructor
public class FileManagerController {

    private final FileManagerService fileManagerService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> listFiles(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "/") String path) {
        List<FileEntry> entries = fileManagerService.listFiles(id, path);
        return ResponseEntity.ok(Map.of("path", path, "entries", entries));
    }

    @GetMapping("/content")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<String> readFile(
            @PathVariable UUID id,
            @RequestParam String path) {
        return ResponseEntity.ok(fileManagerService.readFile(id, path));
    }

    @PutMapping("/content")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> writeFile(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        fileManagerService.writeFile(id, body.get("path"), body.get("content"));
        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> uploadFile(
            @PathVariable UUID id,
            @RequestParam String path,
            @RequestParam MultipartFile file) {
        fileManagerService.uploadFile(id, path, file);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteFile(
            @PathVariable UUID id,
            @RequestParam String path) {
        fileManagerService.deleteFile(id, path);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/mkdir")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> createDirectory(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        fileManagerService.createDirectory(id, body.get("path"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/rename")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> rename(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        fileManagerService.rename(id, body.get("from"), body.get("to"));
        return ResponseEntity.ok().build();
    }
}
