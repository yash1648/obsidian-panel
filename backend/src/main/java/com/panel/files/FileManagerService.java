package com.panel.files;

import com.panel.files.dto.FileEntry;
import com.panel.security.FileValidationService;
import com.panel.servers.Server;
import com.panel.servers.ServerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileManagerService {

    private final ServerService serverService;
    private final FileValidationService fileValidationService;

    public List<FileEntry> listFiles(UUID serverId, String path) {
        Server server = serverService.getOrThrow(serverId);
        Path resolved = resolveSafePath(server, path);

        if (!Files.exists(resolved)) {
            throw new IllegalArgumentException("Path does not exist: " + path);
        }
        if (!Files.isDirectory(resolved)) {
            throw new IllegalArgumentException("Path is not a directory: " + path);
        }

        try (Stream<Path> paths = Files.list(resolved)) {
            return paths
                    .sorted(Comparator.comparing(p -> !Files.isDirectory(p))) // directories first
                    .map(this::toFileEntry)
                    .toList();
        } catch (IOException e) {
            throw new RuntimeException("Failed to list files: " + path, e);
        }
    }

    public String readFile(UUID serverId, String path) {
        Server server = serverService.getOrThrow(serverId);
        Path resolved = resolveSafePath(server, path);

        if (!Files.exists(resolved) || Files.isDirectory(resolved)) {
            throw new IllegalArgumentException("File not found: " + path);
        }

        try {
            return Files.readString(resolved);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file: " + path, e);
        }
    }

    public void writeFile(UUID serverId, String path, String content) {
        Server server = serverService.getOrThrow(serverId);
        Path resolved = resolveSafePath(server, path);

        try {
            Files.createDirectories(resolved.getParent());
            Files.writeString(resolved, content);
            log.info("Written file: {}", resolved);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write file: " + path, e);
        }
    }

    public void uploadFile(UUID serverId, String directory, MultipartFile file) {
        fileValidationService.validate(file);
        Server server = serverService.getOrThrow(serverId);
        Path resolved = resolveSafePath(server, directory + "/" + file.getOriginalFilename());

        try {
            Files.createDirectories(resolved.getParent());
            file.transferTo(resolved.toFile());
            log.info("Uploaded file: {}", resolved);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + file.getOriginalFilename(), e);
        }
    }

    public void deleteFile(UUID serverId, String path) {
        Server server = serverService.getOrThrow(serverId);
        Path resolved = resolveSafePath(server, path);

        try {
            if (Files.isDirectory(resolved)) {
                try (Stream<Path> walk = Files.walk(resolved)) {
                    walk.sorted(Comparator.reverseOrder())
                            .forEach(p -> {
                                try { Files.deleteIfExists(p); } catch (IOException e) {
                                    throw new RuntimeException("Failed to delete: " + p, e);
                                }
                            });
                }
            } else {
                Files.deleteIfExists(resolved);
            }
            log.info("Deleted: {}", resolved);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete: " + path, e);
        }
    }

    public void createDirectory(UUID serverId, String path) {
        Server server = serverService.getOrThrow(serverId);
        Path resolved = resolveSafePath(server, path);

        try {
            Files.createDirectories(resolved);
            log.info("Created directory: {}", resolved);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create directory: " + path, e);
        }
    }

    public void rename(UUID serverId, String from, String to) {
        Server server = serverService.getOrThrow(serverId);
        Path source = resolveSafePath(server, from);
        Path target = resolveSafePath(server, to);

        try {
            Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
            log.info("Renamed: {} → {}", source, target);
        } catch (IOException e) {
            throw new RuntimeException("Failed to rename: " + from + " → " + to, e);
        }
    }

    private Path resolveSafePath(Server server, String userPath) {
        try {
            Path root = Paths.get(server.getHostPath()).toRealPath();
            Path resolved = root.resolve(userPath.startsWith("/") ? userPath.substring(1) : userPath).normalize();

            if (!resolved.startsWith(root)) {
                throw new SecurityException("Path traversal detected: " + userPath);
            }
            return resolved;
        } catch (IOException e) {
            throw new RuntimeException("Failed to resolve path: " + userPath, e);
        }
    }

    private FileEntry toFileEntry(Path path) {
        try {
            BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);
            return FileEntry.builder()
                    .name(path.getFileName().toString())
                    .type(attrs.isDirectory() ? FileEntry.FileType.DIRECTORY : FileEntry.FileType.FILE)
                    .size(attrs.size())
                    .modified(attrs.lastModifiedTime().toInstant()
                            .atZone(java.time.ZoneId.systemDefault()).toLocalDateTime())
                    .build();
        } catch (IOException e) {
            return FileEntry.builder()
                    .name(path.getFileName().toString())
                    .type(Files.isDirectory(path) ? FileEntry.FileType.DIRECTORY : FileEntry.FileType.FILE)
                    .build();
        }
    }
}
