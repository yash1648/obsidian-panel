package com.panel.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditRepository auditRepository;

    public void record(AuditLog log) {
        auditRepository.save(log);
    }

    public Page<AuditLog> findAll(Pageable pageable) {
        return auditRepository.findAllByOrderByTimestampDesc(pageable);
    }

    public Page<AuditLog> findByUser(UUID userId, Pageable pageable) {
        return auditRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
    }

    public Page<AuditLog> findByAction(String action, Pageable pageable) {
        return auditRepository.findByActionOrderByTimestampDesc(action, pageable);
    }
}
