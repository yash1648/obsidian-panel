package com.panel.files.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FileEntry {
    private String name;
    private FileType type;
    private long size;
    private LocalDateTime modified;

    public enum FileType {
        FILE, DIRECTORY
    }
}
