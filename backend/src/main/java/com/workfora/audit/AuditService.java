package com.workfora.audit;

import com.workfora.audit.domain.AuditLog;
import com.workfora.audit.repository.AuditLogRepository;
import com.workfora.security.SecurityUtils;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void log(String action, String entityType, UUID entityId, String details) {
        AuditLog log = new AuditLog();
        log.setActorUserId(SecurityUtils.currentUser().map(u -> u.getId()).orElse(null));
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetails(details);
        auditLogRepository.save(log);
    }
}
