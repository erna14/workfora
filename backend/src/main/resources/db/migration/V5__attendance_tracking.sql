-- Extend attendance for check-in/out sessions, breaks, corrections, and schedules

ALTER TABLE attendance_records ADD COLUMN session_state VARCHAR(30) NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE attendance_records ADD COLUMN total_break_seconds BIGINT NOT NULL DEFAULT 0;
ALTER TABLE attendance_records ADD COLUMN gross_work_seconds BIGINT;
ALTER TABLE attendance_records ADD COLUMN net_work_seconds BIGINT;
ALTER TABLE attendance_records ADD COLUMN late_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE attendance_records ADD COLUMN overtime_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE attendance_records ADD COLUMN early_departure_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE attendance_records ADD COLUMN timezone VARCHAR(64) NOT NULL DEFAULT 'UTC';
ALTER TABLE attendance_records ADD COLUMN missing_checkout BOOLEAN NOT NULL DEFAULT FALSE;

-- Active-session uniqueness is enforced in AttendanceService with pessimistic locks
-- (H2 local profile does not support PostgreSQL partial unique indexes).

CREATE TABLE work_schedules (
    id                          UUID PRIMARY KEY,
    organization_id             UUID NOT NULL REFERENCES organizations(id),
    name                        VARCHAR(100) NOT NULL,
    timezone                    VARCHAR(64) NOT NULL DEFAULT 'UTC',
    expected_start_time         TIME NOT NULL,
    expected_end_time           TIME NOT NULL,
    late_grace_minutes          INTEGER NOT NULL DEFAULT 5,
    auto_close_break_on_checkout BOOLEAN NOT NULL DEFAULT TRUE,
    is_default                  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by                  UUID,
    updated_by                  UUID
);

CREATE INDEX idx_work_schedules_org ON work_schedules(organization_id);

CREATE TABLE break_records (
    id                      UUID PRIMARY KEY,
    attendance_record_id    UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    started_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at                TIMESTAMP WITH TIME ZONE,
    duration_seconds        BIGINT,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by              UUID,
    updated_by              UUID
);

CREATE INDEX idx_break_records_attendance ON break_records(attendance_record_id);

CREATE TABLE attendance_corrections (
    id                      UUID PRIMARY KEY,
    attendance_record_id    UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    corrected_by_user_id    UUID NOT NULL REFERENCES users(id),
    field_name              VARCHAR(64) NOT NULL,
    old_value               VARCHAR(500),
    new_value               VARCHAR(500),
    reason                  VARCHAR(1000) NOT NULL,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by              UUID,
    updated_by              UUID
);

CREATE INDEX idx_attendance_corrections_record ON attendance_corrections(attendance_record_id);

INSERT INTO work_schedules (
    id, organization_id, name, timezone, expected_start_time, expected_end_time,
    late_grace_minutes, auto_close_break_on_checkout, is_default, created_at, updated_at
) VALUES (
    'c0000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Standard Day',
    'UTC',
    TIME '09:00:00',
    TIME '17:00:00',
    5,
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Align existing rows: checked-out => COMPLETED, open => WORKING
UPDATE attendance_records
SET session_state = CASE
    WHEN check_out_at IS NOT NULL THEN 'COMPLETED'
    WHEN check_in_at IS NOT NULL THEN 'WORKING'
    ELSE 'COMPLETED'
END;

-- Managers need self check-in/out
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'b0000000-0000-0000-0000-000000000004', id FROM permissions
WHERE code = 'attendance:write'
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.role_id = 'b0000000-0000-0000-0000-000000000004'
        AND rp.permission_id = permissions.id
  );
