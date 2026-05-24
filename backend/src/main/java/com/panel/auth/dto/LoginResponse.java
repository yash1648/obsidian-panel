package com.panel.auth.dto;

import com.panel.users.Role;
import lombok.*;

import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private UserInfo user;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UserInfo {
        private UUID id;
        private String username;
        private Role role;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class AccessTokenResponse {
        private String accessToken;
        private long expiresIn;
    }
}
