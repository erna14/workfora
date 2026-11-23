-- Fixed UUIDs for deterministic local seeding
-- Password for admin@workfora.com is: Admin123! (BCrypt)
-- Generated with BCrypt strength 10

INSERT INTO organizations (id, name, legal_name, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'Workfora Demo', 'Workfora Demo Inc.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO locations (id, organization_id, name, city, country, timezone, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Headquarters', 'San Francisco', 'US', 'America/Los_Angeles', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO departments (id, organization_id, parent_id, code, name, description, created_at, updated_at)
VALUES
 ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', NULL, 'ENG', 'Engineering', 'Product engineering', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', NULL, 'HR', 'Human Resources', 'People operations', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', NULL, 'FIN', 'Finance', 'Finance and payroll', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO positions (id, department_id, title, level, created_at, updated_at)
VALUES
 ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 'Software Engineer', 'IC3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333332', 'HR Administrator', 'M1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333331', 'Engineering Manager', 'M2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO teams (id, department_id, name, created_at, updated_at)
VALUES ('55555555-5555-5555-5555-555555555551', '33333333-3333-3333-3333-333333333331', 'Platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Permissions
INSERT INTO permissions (id, code, description, created_at, updated_at) VALUES
 ('a0000000-0000-0000-0000-000000000001', 'org:configure', 'Manage organization structure', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000002', 'employee:read', 'View employees', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000003', 'employee:write', 'Create and update employees', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000004', 'attendance:read', 'View attendance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000005', 'attendance:write', 'Manage attendance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000006', 'leave:read', 'View leave', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000007', 'leave:write', 'Request leave', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000008', 'leave:approve', 'Approve leave', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000009', 'recruitment:read', 'View recruitment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000010', 'recruitment:write', 'Manage recruitment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000011', 'onboarding:read', 'View onboarding', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000012', 'onboarding:write', 'Manage onboarding', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000013', 'payroll:read', 'View payroll', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000014', 'payroll:write', 'Manage payroll', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000015', 'performance:read', 'View performance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000016', 'performance:write', 'Manage performance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000017', 'asset:read', 'View assets', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000018', 'asset:write', 'Manage assets', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000019', 'report:read', 'View reports', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000020', 'notification:read', 'View notifications', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('a0000000-0000-0000-0000-000000000021', 'dashboard:read', 'View dashboard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Roles
INSERT INTO roles (id, code, name, description, created_at, updated_at) VALUES
 ('b0000000-0000-0000-0000-000000000001', 'SUPER_ADMIN', 'Super Administrator', 'Full system access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('b0000000-0000-0000-0000-000000000002', 'HR_ADMIN', 'HR Administrator', 'Organization-wide HR configuration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('b0000000-0000-0000-0000-000000000003', 'HR_OFFICER', 'HR Officer', 'Day-to-day HR operations', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('b0000000-0000-0000-0000-000000000004', 'DEPT_MANAGER', 'Department Manager', 'Team approvals and visibility', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('b0000000-0000-0000-0000-000000000005', 'EMPLOYEE', 'Employee', 'Self-service access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- SUPER_ADMIN gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'b0000000-0000-0000-0000-000000000001', id FROM permissions;

-- HR_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'b0000000-0000-0000-0000-000000000002', id FROM permissions
WHERE code IN (
  'org:configure','employee:read','employee:write','attendance:read','attendance:write',
  'leave:read','leave:write','leave:approve','recruitment:read','recruitment:write',
  'onboarding:read','onboarding:write','payroll:read','payroll:write','performance:read',
  'performance:write','asset:read','asset:write','report:read','notification:read','dashboard:read'
);

-- HR_OFFICER
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'b0000000-0000-0000-0000-000000000003', id FROM permissions
WHERE code IN (
  'employee:read','employee:write','attendance:read','attendance:write',
  'leave:read','leave:write','leave:approve','recruitment:read','recruitment:write',
  'onboarding:read','onboarding:write','asset:read','asset:write','report:read',
  'notification:read','dashboard:read'
);

-- DEPT_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'b0000000-0000-0000-0000-000000000004', id FROM permissions
WHERE code IN (
  'employee:read','attendance:read','leave:read','leave:write','leave:approve',
  'performance:read','performance:write','notification:read','dashboard:read'
);

-- EMPLOYEE
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'b0000000-0000-0000-0000-000000000005', id FROM permissions
WHERE code IN (
  'employee:read','attendance:read','attendance:write','leave:read','leave:write',
  'notification:read','dashboard:read','performance:read'
);

INSERT INTO employees (
  id, organization_id, employee_number, first_name, last_name, work_email, status, hire_date,
  department_id, position_id, location_id, job_title, created_at, updated_at
) VALUES (
  '66666666-6666-6666-6666-666666666661',
  '11111111-1111-1111-1111-111111111111',
  'EMP-0001',
  'Alex',
  'Admin',
  'admin@workfora.com',
  'ACTIVE',
  DATE '2024-01-15',
  '33333333-3333-3333-3333-333333333332',
  '44444444-4444-4444-4444-444444444442',
  '22222222-2222-2222-2222-222222222221',
  'Super Administrator',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO employees (
  id, organization_id, employee_number, first_name, last_name, work_email, status, hire_date,
  department_id, position_id, manager_id, location_id, job_title, created_at, updated_at
) VALUES
 (
  '66666666-6666-6666-6666-666666666662',
  '11111111-1111-1111-1111-111111111111',
  'EMP-0002',
  'Sam',
  'Manager',
  'manager@workfora.com',
  'ACTIVE',
  DATE '2024-03-01',
  '33333333-3333-3333-3333-333333333331',
  '44444444-4444-4444-4444-444444444443',
  '66666666-6666-6666-6666-666666666661',
  '22222222-2222-2222-2222-222222222221',
  'Engineering Manager',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
 (
  '66666666-6666-6666-6666-666666666663',
  '11111111-1111-1111-1111-111111111111',
  'EMP-0003',
  'Jamie',
  'Employee',
  'employee@workfora.com',
  'ACTIVE',
  DATE '2024-06-10',
  '33333333-3333-3333-3333-333333333331',
  '44444444-4444-4444-4444-444444444441',
  '66666666-6666-6666-6666-666666666662',
  '22222222-2222-2222-2222-222222222221',
  'Software Engineer',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- BCrypt hash for Admin123!
INSERT INTO users (id, email, password_hash, enabled, employee_id, created_at, updated_at) VALUES
 ('77777777-7777-7777-7777-777777777771', 'admin@workfora.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, '66666666-6666-6666-6666-666666666661', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('77777777-7777-7777-7777-777777777772', 'manager@workfora.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, '66666666-6666-6666-6666-666666666662', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('77777777-7777-7777-7777-777777777773', 'employee@workfora.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, '66666666-6666-6666-6666-666666666663', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO user_roles (user_id, role_id) VALUES
 ('77777777-7777-7777-7777-777777777771', 'b0000000-0000-0000-0000-000000000001'),
 ('77777777-7777-7777-7777-777777777772', 'b0000000-0000-0000-0000-000000000004'),
 ('77777777-7777-7777-7777-777777777773', 'b0000000-0000-0000-0000-000000000005');
