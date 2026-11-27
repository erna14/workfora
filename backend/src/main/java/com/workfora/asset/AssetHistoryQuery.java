package com.workfora.asset;

import com.workfora.common.exception.BusinessException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.nio.ByteBuffer;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public class AssetHistoryQuery {

    private static final Set<String> TYPES = Set.of("CREATED", "UPDATED", "ARCHIVED", "ASSIGNED", "RETURNED");
    private static final int MAX_PAGE_SIZE = 100;

    private static final String FEED = """
            SELECT event_type, occurred_at, asset_id, asset_name, asset_tag, asset_status, archived_at,
                   actor_user_id, field_name, previous_value, new_value, employee_id, assigned_at, returned_at, notes
            FROM (
                SELECT 'CREATED' AS event_type, a.created_at AS occurred_at, a.id AS asset_id, a.name AS asset_name,
                       a.asset_tag AS asset_tag, a.status AS asset_status, a.archived_at AS archived_at,
                       a.created_by AS actor_user_id, CAST(NULL AS VARCHAR(50)) AS field_name,
                       CAST(NULL AS VARCHAR(1000)) AS previous_value, a.name AS new_value,
                       CAST(NULL AS UUID) AS employee_id, CAST(NULL AS TIMESTAMP WITH TIME ZONE) AS assigned_at,
                       CAST(NULL AS TIMESTAMP WITH TIME ZONE) AS returned_at, CAST(NULL AS VARCHAR(1000)) AS notes
                FROM assets a
                WHERE a.organization_id = :orgId
                UNION ALL
                SELECT e.event_type, e.occurred_at, e.asset_id, a.name, a.asset_tag, a.status, a.archived_at,
                       e.actor_user_id, e.field_name, e.previous_value, e.new_value,
                       CAST(NULL AS UUID), CAST(NULL AS TIMESTAMP WITH TIME ZONE), CAST(NULL AS TIMESTAMP WITH TIME ZONE),
                       CAST(NULL AS VARCHAR(1000))
                FROM asset_events e
                JOIN assets a ON a.id = e.asset_id
                WHERE e.organization_id = :orgId
                UNION ALL
                SELECT 'ASSIGNED', aa.assigned_at, a.id, a.name, a.asset_tag, a.status, a.archived_at,
                       aa.created_by, CAST(NULL AS VARCHAR(50)), CAST(NULL AS VARCHAR(1000)), CAST(NULL AS VARCHAR(1000)),
                       aa.employee_id, aa.assigned_at, aa.returned_at, aa.notes
                FROM asset_assignments aa
                JOIN assets a ON a.id = aa.asset_id
                WHERE a.organization_id = :orgId
                UNION ALL
                SELECT 'RETURNED', aa.returned_at, a.id, a.name, a.asset_tag, a.status, a.archived_at,
                       aa.updated_by, CAST(NULL AS VARCHAR(50)), CAST(NULL AS VARCHAR(1000)), CAST(NULL AS VARCHAR(1000)),
                       aa.employee_id, aa.assigned_at, aa.returned_at, aa.notes
                FROM asset_assignments aa
                JOIN assets a ON a.id = aa.asset_id
                WHERE a.organization_id = :orgId AND aa.returned_at IS NOT NULL
            ) feed
            WHERE 1 = 1
            """;

    private final EntityManager entityManager;

    public AssetHistoryQuery(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public Page<Row> page(UUID organizationId, UUID assetId, String type, String search, Pageable pageable) {
        String eventType = normalizeType(type);
        String term = normalizeSearch(search);
        StringBuilder sql = new StringBuilder(FEED);
        if (assetId != null) {
            sql.append(" AND asset_id = :assetId");
        }
        if (eventType != null) {
            sql.append(" AND event_type = :eventType");
        }
        if (term != null) {
            sql.append(" AND (LOWER(asset_name) LIKE :search OR LOWER(asset_tag) LIKE :search)");
        }
        int size = Math.min(Math.max(pageable.getPageSize(), 1), MAX_PAGE_SIZE);
        int page = Math.max(pageable.getPageNumber(), 0);

        Query count = entityManager.createNativeQuery("SELECT COUNT(*) FROM (" + sql + ") counted");
        bind(count, organizationId, assetId, eventType, term);
        long total = ((Number) count.getSingleResult()).longValue();

        Query rows = entityManager.createNativeQuery(sql + " ORDER BY occurred_at DESC");
        bind(rows, organizationId, assetId, eventType, term);
        rows.setFirstResult(page * size);
        rows.setMaxResults(size);
        @SuppressWarnings("unchecked")
        List<Object[]> result = rows.getResultList();
        List<Row> content = result.stream().map(AssetHistoryQuery::map).toList();
        return new PageImpl<>(content, org.springframework.data.domain.PageRequest.of(page, size), total);
    }

    public record Row(
            String eventType,
            Instant occurredAt,
            UUID assetId,
            String assetName,
            String assetTag,
            String assetStatus,
            Instant archivedAt,
            UUID actorUserId,
            String fieldName,
            String previousValue,
            String newValue,
            UUID employeeId,
            Instant assignedAt,
            Instant returnedAt,
            String notes
    ) {}

    private static void bind(Query query, UUID organizationId, UUID assetId, String eventType, String term) {
        query.setParameter("orgId", organizationId);
        if (assetId != null) {
            query.setParameter("assetId", assetId);
        }
        if (eventType != null) {
            query.setParameter("eventType", eventType);
        }
        if (term != null) {
            query.setParameter("search", "%" + term + "%");
        }
    }

    private static String normalizeType(String type) {
        if (type == null || type.isBlank()) {
            return null;
        }
        String normalized = type.trim().toUpperCase(Locale.ROOT);
        if (!TYPES.contains(normalized)) {
            throw new BusinessException("Unknown history event type");
        }
        return normalized;
    }

    private static String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        String trimmed = search.trim().toLowerCase(Locale.ROOT);
        if (trimmed.length() > 100) {
            trimmed = trimmed.substring(0, 100);
        }
        return trimmed;
    }

    private static Row map(Object[] row) {
        return new Row(
                text(row[0]),
                instant(row[1]),
                uuid(row[2]),
                text(row[3]),
                text(row[4]),
                text(row[5]),
                instant(row[6]),
                uuid(row[7]),
                text(row[8]),
                text(row[9]),
                text(row[10]),
                uuid(row[11]),
                instant(row[12]),
                instant(row[13]),
                text(row[14])
        );
    }

    private static String text(Object value) {
        return value == null ? null : value.toString();
    }

    private static UUID uuid(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof UUID id) {
            return id;
        }
        if (value instanceof byte[] bytes && bytes.length == 16) {
            ByteBuffer buffer = ByteBuffer.wrap(bytes);
            return new UUID(buffer.getLong(), buffer.getLong());
        }
        return UUID.fromString(value.toString());
    }

    private static Instant instant(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof OffsetDateTime offset) {
            return offset.toInstant();
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toInstant();
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant();
        }
        return Instant.parse(value.toString());
    }
}
