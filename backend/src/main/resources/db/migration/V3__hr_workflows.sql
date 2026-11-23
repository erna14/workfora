-- Attendance
CREATE TABLE attendance_records (
    id              UUID PRIMARY KEY,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    work_date       DATE NOT NULL,
    check_in_at     TIMESTAMP WITH TIME ZONE,
    check_out_at    TIMESTAMP WITH TIME ZONE,
    status          VARCHAR(30) NOT NULL DEFAULT 'PRESENT',
    notes           VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, work_date)
);

CREATE INDEX idx_attendance_employee ON attendance_records(employee_id);
CREATE INDEX idx_attendance_work_date ON attendance_records(work_date);

-- Leave
CREATE TABLE leave_types (
    id                UUID PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id),
    code              VARCHAR(50) NOT NULL,
    name              VARCHAR(100) NOT NULL,
    paid              BOOLEAN NOT NULL DEFAULT TRUE,
    max_days_per_year INT,
    description       VARCHAR(500),
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by        UUID,
    updated_by        UUID,
    CONSTRAINT uq_leave_types_code UNIQUE (organization_id, code)
);

CREATE TABLE leave_balances (
    id              UUID PRIMARY KEY,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    leave_type_id   UUID NOT NULL REFERENCES leave_types(id),
    balance_year    INT NOT NULL,
    entitled        NUMERIC(8, 2) NOT NULL DEFAULT 0,
    used            NUMERIC(8, 2) NOT NULL DEFAULT 0,
    pending         NUMERIC(8, 2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uq_leave_balances UNIQUE (employee_id, leave_type_id, balance_year)
);

CREATE TABLE leave_requests (
    id              UUID PRIMARY KEY,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    leave_type_id   UUID NOT NULL REFERENCES leave_types(id),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    days            NUMERIC(8, 2) NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    reason          VARCHAR(1000),
    reviewed_by     UUID REFERENCES employees(id),
    reviewed_at     TIMESTAMP WITH TIME ZONE,
    review_notes    VARCHAR(1000),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

CREATE TABLE holidays (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name            VARCHAR(150) NOT NULL,
    holiday_date    DATE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uq_holidays_date UNIQUE (organization_id, holiday_date)
);

-- Recruitment
CREATE TABLE job_openings (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    department_id   UUID REFERENCES departments(id),
    location_id     UUID REFERENCES locations(id),
    title           VARCHAR(200) NOT NULL,
    description     VARCHAR(4000),
    status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    openings        INT NOT NULL DEFAULT 1,
    published_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE recruitment_stages (
    id              UUID PRIMARY KEY,
    job_opening_id  UUID NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE applicants (
    id              UUID PRIMARY KEY,
    job_opening_id  UUID NOT NULL REFERENCES job_openings(id),
    stage_id        UUID REFERENCES recruitment_stages(id),
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    resume_path     VARCHAR(500),
    status          VARCHAR(30) NOT NULL DEFAULT 'APPLIED',
    notes           VARCHAR(2000),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE INDEX idx_applicants_job ON applicants(job_opening_id);

CREATE TABLE interviews (
    id              UUID PRIMARY KEY,
    applicant_id    UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    interviewer_id  UUID REFERENCES employees(id),
    scheduled_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    interview_type  VARCHAR(50) NOT NULL DEFAULT 'VIDEO',
    status          VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    feedback        VARCHAR(2000),
    score           NUMERIC(5, 2),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

-- Onboarding
CREATE TABLE onboarding_templates (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name            VARCHAR(150) NOT NULL,
    description     VARCHAR(1000),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE onboarding_template_tasks (
    id                UUID PRIMARY KEY,
    template_id       UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
    title             VARCHAR(200) NOT NULL,
    description       VARCHAR(1000),
    sort_order        INT NOT NULL DEFAULT 0,
    due_days_offset   INT NOT NULL DEFAULT 7,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by        UUID,
    updated_by        UUID
);

CREATE TABLE onboarding_checklists (
    id              UUID PRIMARY KEY,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    template_id     UUID REFERENCES onboarding_templates(id),
    status          VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    started_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE onboarding_tasks (
    id              UUID PRIMARY KEY,
    checklist_id    UUID NOT NULL REFERENCES onboarding_checklists(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     VARCHAR(1000),
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    due_date        DATE,
    completed_at    TIMESTAMP WITH TIME ZONE,
    assignee_id     UUID REFERENCES employees(id),
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

-- Seed default leave types for demo org
INSERT INTO leave_types (id, organization_id, code, name, paid, max_days_per_year, description, created_at, updated_at)
VALUES
 ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'ANNUAL', 'Annual Leave', TRUE, 20, 'Paid annual leave', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('c0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'SICK', 'Sick Leave', TRUE, 10, 'Paid sick leave', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('c0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'UNPAID', 'Unpaid Leave', FALSE, NULL, 'Unpaid leave', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
