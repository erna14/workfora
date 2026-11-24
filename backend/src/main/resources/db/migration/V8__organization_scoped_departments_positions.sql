-- Organization-scoped department and position management.
-- Positions already reference a department; this copies that department's organization
-- onto the position and constrains the pair so a position cannot point at another tenant.

ALTER TABLE departments ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE departments ADD COLUMN manager_employee_id UUID;

ALTER TABLE positions ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE positions ADD COLUMN organization_id UUID;

UPDATE positions
SET organization_id = (
    SELECT d.organization_id
    FROM departments d
    WHERE d.id = positions.department_id
)
WHERE organization_id IS NULL;

ALTER TABLE positions ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE departments ADD CONSTRAINT chk_departments_status CHECK (status IN ('ACTIVE', 'INACTIVE'));
ALTER TABLE positions ADD CONSTRAINT chk_positions_status CHECK (status IN ('ACTIVE', 'INACTIVE'));

ALTER TABLE departments ADD CONSTRAINT uq_departments_id_org UNIQUE (id, organization_id);
ALTER TABLE employees ADD CONSTRAINT uq_employees_id_org UNIQUE (id, organization_id);

ALTER TABLE positions
    ADD CONSTRAINT fk_positions_department_org
    FOREIGN KEY (department_id, organization_id)
    REFERENCES departments (id, organization_id);

ALTER TABLE departments
    ADD CONSTRAINT fk_departments_manager_org
    FOREIGN KEY (manager_employee_id, organization_id)
    REFERENCES employees (id, organization_id);

CREATE INDEX idx_departments_org ON departments (organization_id);
CREATE INDEX idx_departments_status ON departments (organization_id, status);
CREATE INDEX idx_positions_org ON positions (organization_id);
CREATE INDEX idx_positions_department ON positions (department_id);
CREATE INDEX idx_positions_status ON positions (organization_id, status);

-- Exact name and title uniqueness is enforced in the database.
-- Case-insensitive duplicates are rejected by the service so the same rule works on PostgreSQL and H2.
-- uq_departments_code already keeps (organization_id, code) unique.
ALTER TABLE departments ADD CONSTRAINT uq_departments_org_name UNIQUE (organization_id, name);
ALTER TABLE positions ADD CONSTRAINT uq_positions_dept_title UNIQUE (department_id, title);

INSERT INTO permissions (id, code, description, created_at, updated_at) VALUES
 ('a0000000-0000-0000-0000-000000000022', 'department:read', 'View departments in the active organization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000023', 'department:create', 'Create departments in the active organization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000024', 'department:update', 'Update departments in the active organization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000025', 'department:delete', 'Delete departments in the active organization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000026', 'position:read', 'View positions in the active organization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000027', 'position:create', 'Create positions in the active organization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000028', 'position:update', 'Update positions in the active organization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000029', 'position:delete', 'Delete positions in the active organization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Structure administrators
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'department:read', 'department:create', 'department:update', 'department:delete',
    'position:read', 'position:create', 'position:update', 'position:delete'
)
WHERE r.code IN ('SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN');

-- Read-only access for people who assign or view the structure, without management rights.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('department:read', 'position:read')
WHERE r.code IN ('HR_OFFICER', 'DEPT_MANAGER', 'EMPLOYEE');
