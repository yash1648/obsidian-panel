package com.panel.audit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditService auditService;

    @AfterReturning("@annotation(audited)")
    public void logAction(JoinPoint jp, Audited audited) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        String username = "system";
        UUID userId = null;

        if (auth != null && auth.isAuthenticated()) {
            username = auth.getName();
            if (auth.getPrincipal() instanceof com.panel.auth.AuthPrincipal principal) {
                userId = principal.getId();
            }
        }

        String ipAddress = Optional.ofNullable(RequestContextHolder.getRequestAttributes())
                .filter(ServletRequestAttributes.class::isInstance)
                .map(ServletRequestAttributes.class::cast)
                .map(ServletRequestAttributes::getRequest)
                .map(HttpServletRequest::getRemoteAddr)
                .orElse("unknown");

        AuditLog log = AuditLog.builder()
                .userId(userId)
                .username(username)
                .action(audited.action())
                .entityType(audited.entityType())
                .timestamp(LocalDateTime.now())
                .ipAddress(ipAddress)
                .build();

        // Try to extract entity ID from first argument if it's a UUID
        Object[] args = jp.getArgs();
        if (args.length > 0 && args[0] instanceof UUID entityId) {
            log.setEntityId(entityId);
        }

        auditService.record(log);
    }
}
