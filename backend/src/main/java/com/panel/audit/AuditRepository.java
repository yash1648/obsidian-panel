package com.panel.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByUserIdOrderByTimestampDesc(UUID userId, Pageable pageable);
    Page<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
}
