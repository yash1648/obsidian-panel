package com.panel.auth;

import com.panel.users.Role;
import lombok.Value;

import java.util.UUID;

@Value
public class AuthPrincipal {
    UUID id;
    String username;
    Role role;
}
