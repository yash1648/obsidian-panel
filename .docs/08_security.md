# 08 — Security Architecture

## Role-Based Access Control (RBAC)

### Roles

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | Full system access including user management, node settings |
| `ADMIN` | Create/manage servers, allocate resources, manage plugins/backups |
| `MODERATOR` | Console access, player management, view configs (no edit) |
| `VIEWER` | Read-only access to dashboards and monitoring |

### Permission Matrix

| Action | VIEWER | MODERATOR | ADMIN | SUPER_ADMIN |
|--------|--------|-----------|-------|-------------|
| View server list | ✓ | ✓ | ✓ | ✓ |
| View monitoring | ✓ | ✓ | ✓ | ✓ |
| Access console | ✗ | ✓ | ✓ | ✓ |
| Send commands | ✗ | ✓ | ✓ | ✓ |
| Manage players | ✗ | ✓ | ✓ | ✓ |
| Edit config | ✗ | ✗ | ✓ | ✓ |
| Manage files | ✗ | ✗ | ✓ | ✓ |
| Install plugins | ✗ | ✗ | ✓ | ✓ |
| Create/delete servers | ✗ | ✗ | ✓ | ✓ |
| Manage backups | ✗ | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✗ | ✓ |
| System settings | ✗ | ✗ | ✗ | ✓ |
| View audit logs | ✗ | ✗ | ✓ | ✓ |

---

## JWT Authentication

### Token Strategy

| Token | Expiry | Purpose |
|-------|--------|---------|
| Access Token | 15 minutes | API authorization |
| Refresh Token | 7 days | Issue new access tokens |

Refresh tokens are stored in Redis with the user ID as key. On logout, the refresh token is deleted from Redis — immediately invalidating the session.

### SecurityConfig

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
            .cors(cors -> cors.configurationSource(corsConfig()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/servers/**").hasAnyRole("VIEWER","MODERATOR","ADMIN","SUPER_ADMIN")
                .requestMatchers("/api/v1/users/**").hasRole("SUPER_ADMIN")
                .anyRequest().hasAnyRole("ADMIN", "SUPER_ADMIN")
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

### Method-Level Security (Fine-grained)

```java
@Service
public class ServerService {

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ServerDto createServer(CreateServerRequest req) { ... }

    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN', 'SUPER_ADMIN')")
    public void startServer(UUID id) { ... }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public void deleteServer(UUID id) { ... }
}
```

---

## Brute Force Protection

Implemented via Redis-backed rate limiting on the login endpoint.

```java
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    public void checkAndIncrement(String username, String ip) {
        String key = "login:failed:" + ip;
        Long attempts = redisTemplate.opsForValue().increment(key);
        
        if (attempts == 1) {
            redisTemplate.expire(key, LOCK_DURATION);
        }
        
        if (attempts > MAX_ATTEMPTS) {
            throw new TooManyLoginAttemptsException(
                "Account locked for 15 minutes due to too many failed attempts."
            );
        }
    }

    public void resetAttempts(String ip) {
        redisTemplate.delete("login:failed:" + ip);
    }
}
```

---

## File Upload Security

All uploaded files are validated before being written to the server volume.

```java
@Service
public class FileValidationService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        "jar", "txt", "yml", "yaml", "json", "properties",
        "zip", "tar", "gz", "png", "jpg", "nbt", "schematic"
    );

    private static final long MAX_FILE_SIZE = 500L * 1024 * 1024; // 500 MB

    public void validate(MultipartFile file) {
        // Size check
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileTooLargeException("File exceeds 500MB limit.");
        }

        // Extension whitelist
        String ext = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(ext.toLowerCase())) {
            throw new InvalidFileTypeException("File type ." + ext + " is not permitted.");
        }

        // Path traversal protection
        String name = file.getOriginalFilename();
        if (name != null && (name.contains("..") || name.contains("/"))) {
            throw new InvalidFileNameException("Invalid file name.");
        }
    }
}
```

---

## Path Traversal Prevention (File Manager)

All file manager operations normalize and validate the resolved path against the allowed root.

```java
public Path resolveSafePath(Server server, String userPath) {
    Path root = Paths.get(server.getHostPath()).toRealPath();
    Path resolved = root.resolve(userPath).normalize();
    
    if (!resolved.startsWith(root)) {
        throw new PathTraversalException("Access denied: path escapes server root.");
    }
    
    return resolved;
}
```

---

## CORS Configuration

```java
@Bean
public CorsConfigurationSource corsConfig() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://panel.yourdomain.com"));
    config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

---

## Audit Trail

Every significant action is automatically logged via AOP.

### Audited actions include:

```
AUTH_LOGIN
AUTH_LOGOUT
SERVER_CREATED
SERVER_DELETED
SERVER_STARTED
SERVER_STOPPED
SERVER_RESTARTED
SERVER_KILLED
CONFIG_UPDATED
PLUGIN_INSTALLED
PLUGIN_DELETED
BACKUP_CREATED
BACKUP_RESTORED
BACKUP_DELETED
FILE_UPLOADED
FILE_DELETED
USER_CREATED
USER_ROLE_CHANGED
COMMAND_SENT
PLAYER_BANNED
PLAYER_KICKED
PLAYER_OPPED
```

Audit logs are **append-only** (no update/delete endpoints). Retention policy can be configured (default: 90 days).

---

## RCON Password Security

- RCON passwords are generated automatically (UUID-based, 32 chars) on server creation.
- They are stored encrypted at rest using AES-256 via Spring's `TextEncryptor`.
- Users never see or set RCON passwords — the panel manages this internally.
- RCON is bound to `127.0.0.1` inside Docker — not externally accessible.

---

## Security Checklist

| Control | Status |
|---------|--------|
| JWT with short expiry | ✓ |
| Refresh token in Redis (revocable) | ✓ |
| BCrypt password hashing | ✓ |
| RBAC with method-level security | ✓ |
| Brute force protection | ✓ |
| Path traversal prevention | ✓ |
| File type whitelist | ✓ |
| CORS configuration | ✓ |
| CSRF (stateless, not needed) | N/A |
| Audit logging | ✓ |
| RCON not exposed externally | ✓ |
| HTTPS via Nginx | ✓ |
| Encrypted RCON passwords | ✓ |
