-- Organization
CREATE TABLE organizations (
    id              UUID PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    legal_name      VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE locations (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name            VARCHAR(150) NOT NULL,
    address_line1   VARCHAR(255),
    city            VARCHAR(100),
    country         VARCHAR(100),
    timezone        VARCHAR(64) NOT NULL DEFAULT 'UTC',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE departments (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    parent_id       UUID REFERENCES departments(id),
    code            VARCHAR(50) NOT NULL,
    name            VARCHAR(150) NOT NULL,
    description     VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uq_departments_code UNIQUE (organization_id, code)
);

CREATE TABLE teams (
    id              UUID PRIMARY KEY,
    department_id   UUID NOT NULL REFERENCES departments(id),
    name            VARCHAR(150) NOT NULL,
    description     VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE positions (
    id              UUID PRIMARY KEY,
    department_id   UUID NOT NULL REFERENCES departments(id),
    title           VARCHAR(150) NOT NULL,
    level           VARCHAR(50),
    description     VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

-- Employees
CREATE TABLE employees (
    id                UUID PRIMARY KEY,
    organization_id   UUID NOT NULL REFERENCES organizations(id),
    employee_number   VARCHAR(50) NOT NULL,
    first_name        VARCHAR(100) NOT NULL,
    last_name         VARCHAR(100) NOT NULL,
    work_email        VARCHAR(255) NOT NULL,
    personal_email    VARCHAR(255),
    phone             VARCHAR(50),
    status            VARCHAR(30) NOT NULL,
    hire_date         DATE,
    date_of_birth     DATE,
    department_id     UUID REFERENCES departments(id),
    position_id       UUID REFERENCES positions(id),
    team_id           UUID REFERENCES teams(id),
    manager_id        UUID REFERENCES employees(id),
    location_id       UUID REFERENCES locations(id),
    job_title         VARCHAR(150),
    deactivated_at    TIMESTAMP WITH TIME ZONE,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by        UUID,
    updated_by        UUID,
    CONSTRAINT uq_employees_number UNIQUE (organization_id, employee_number),
    CONSTRAINT uq_employees_work_email UNIQUE (work_email)
);

CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_org ON employees(organization_id);

CREATE TABLE emergency_contacts (
    id              UUID PRIMARY KEY,
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    relationship    VARCHAR(100),
    phone           VARCHAR(50) NOT NULL,
    email           VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE employment_history (
    id              UUID PRIMARY KEY,
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title           VARCHAR(150) NOT NULL,
    department_name VARCHAR(150),
    started_on      DATE NOT NULL,
    ended_on        DATE,
    notes           VARCHAR(500),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE employee_documents (
    id              UUID PRIMARY KEY,
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    file_name       VARCHAR(255) NOT NULL,
    content_type    VARCHAR(100),
    storage_path    VARCHAR(500) NOT NULL,
    category        VARCHAR(100),
    uploaded_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

-- Identity / RBAC
CREATE TABLE permissions (
    id          UUID PRIMARY KEY,
    code        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by  UUID,
    updated_by  UUID
);

CREATE TABLE roles (
    id          UUID PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by  UUID,
    updated_by  UUID
);

CREATE TABLE role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id              UUID PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    employee_id     UUID REFERENCES employees(id),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      UUID,
    updated_by      UUID
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(128) NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by  UUID,
    updated_by  UUID
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE audit_logs (
    id            UUID PRIMARY KEY,
    actor_user_id UUID,
    action        VARCHAR(100) NOT NULL,
    entity_type   VARCHAR(100),
    entity_id     UUID,
    details       VARCHAR(1000),
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by    UUID,
    updated_by    UUID
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
