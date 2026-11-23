-- Payroll
CREATE TABLE salary_structures (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name            VARCHAR(150) NOT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'USD',
    description     VARCHAR(500),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE salary_components (
    id              UUID PRIMARY KEY,
    structure_id    UUID NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    component_type  VARCHAR(30) NOT NULL,
    amount          NUMERIC(12, 2),
    percentage      NUMERIC(8, 4),
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE employee_salaries (
    id              UUID PRIMARY KEY,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    structure_id    UUID NOT NULL REFERENCES salary_structures(id),
    basic_salary    NUMERIC(12, 2) NOT NULL,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE payroll_periods (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name            VARCHAR(100) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    processed_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE payslips (
    id              UUID PRIMARY KEY,
    period_id       UUID NOT NULL REFERENCES payroll_periods(id),
    employee_id     UUID NOT NULL REFERENCES employees(id),
    gross_pay       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_pay         NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uq_payslip_period_employee UNIQUE (period_id, employee_id)
);

CREATE TABLE payslip_lines (
    id              UUID PRIMARY KEY,
    payslip_id      UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
    component_name  VARCHAR(100) NOT NULL,
    component_type  VARCHAR(30) NOT NULL,
    amount          NUMERIC(12, 2) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

-- Performance
CREATE TABLE performance_cycles (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name            VARCHAR(150) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE goals (
    id              UUID PRIMARY KEY,
    cycle_id        UUID NOT NULL REFERENCES performance_cycles(id),
    employee_id     UUID NOT NULL REFERENCES employees(id),
    title           VARCHAR(200) NOT NULL,
    description     VARCHAR(2000),
    target_value    NUMERIC(12, 2),
    current_value   NUMERIC(12, 2) DEFAULT 0,
    weight          NUMERIC(5, 2) DEFAULT 1,
    status          VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE performance_reviews (
    id              UUID PRIMARY KEY,
    cycle_id        UUID NOT NULL REFERENCES performance_cycles(id),
    employee_id     UUID NOT NULL REFERENCES employees(id),
    reviewer_id     UUID REFERENCES employees(id),
    rating          NUMERIC(4, 2),
    comments        VARCHAR(4000),
    status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    submitted_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uq_review_cycle_employee UNIQUE (cycle_id, employee_id)
);

-- Assets
CREATE TABLE asset_categories (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uq_asset_categories_name UNIQUE (organization_id, name)
);

CREATE TABLE assets (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    category_id     UUID REFERENCES asset_categories(id),
    asset_tag       VARCHAR(100) NOT NULL,
    name            VARCHAR(150) NOT NULL,
    serial_number   VARCHAR(100),
    status          VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    purchase_date   DATE,
    purchase_cost   NUMERIC(12, 2),
    notes           VARCHAR(1000),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uq_assets_tag UNIQUE (organization_id, asset_tag)
);

CREATE TABLE asset_assignments (
    id              UUID PRIMARY KEY,
    asset_id        UUID NOT NULL REFERENCES assets(id),
    employee_id     UUID NOT NULL REFERENCES employees(id),
    assigned_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    returned_at     TIMESTAMP WITH TIME ZONE,
    notes           VARCHAR(1000),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE INDEX idx_asset_assignments_asset ON asset_assignments(asset_id);
CREATE INDEX idx_asset_assignments_employee ON asset_assignments(employee_id);

-- Notifications
CREATE TABLE notifications (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    body            VARCHAR(2000),
    notification_type VARCHAR(50) NOT NULL DEFAULT 'INFO',
    link            VARCHAR(500),
    read_at         TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at);
