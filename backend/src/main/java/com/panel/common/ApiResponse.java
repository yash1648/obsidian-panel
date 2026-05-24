package com.panel.common;

import lombok.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApiResponse<T> {
    private int status;
    private String error;
    private String message;
    private String path;
    private LocalDateTime timestamp;
    private T data;

    public static <T> ResponseEntity<ApiResponse<T>> ok(T data) {
        return ResponseEntity.ok(ApiResponse.<T>builder()
                .status(200)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build());
    }

    public static <T> ResponseEntity<ApiResponse<T>> created(T data) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<T>builder()
                        .status(201)
                        .data(data)
                        .timestamp(LocalDateTime.now())
                        .build());
    }

    public static ResponseEntity<ApiResponse<Void>> error(HttpStatus status, String error, String message, String path) {
        return ResponseEntity.status(status)
                .body(ApiResponse.<Void>builder()
                        .status(status.value())
                        .error(error)
                        .message(message)
                        .path(path)
                        .timestamp(LocalDateTime.now())
                        .build());
    }
}
