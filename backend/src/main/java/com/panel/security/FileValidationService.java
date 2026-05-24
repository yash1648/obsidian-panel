package com.panel.security;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Service
public class FileValidationService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jar", "txt", "yml", "yaml", "json", "properties",
            "zip", "tar", "gz", "png", "jpg", "nbt", "schematic"
    );

    private static final long MAX_FILE_SIZE = 500L * 1024 * 1024; // 500 MB

    public void validate(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File exceeds 500MB limit.");
        }

        String ext = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(ext.toLowerCase())) {
            throw new IllegalArgumentException("File type ." + ext + " is not permitted.");
        }

        String name = file.getOriginalFilename();
        if (name != null && (name.contains("..") || name.contains("/"))) {
            throw new IllegalArgumentException("Invalid file name.");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}
