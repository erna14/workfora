-- Multi-tenant organization registration, memberships, email verification, ORG_ADMIN

-- Extend organizations for SaaS workspace provisioning
ALTER TABLE organizations ADD COLUMN slug VARCHAR(120);
ALTER TABLE organizations ADD COLUMN company_email VARCHAR(255);
ALTER TABLE organizations ADD COLUMN industry VARCHAR(100);
ALTER TABLE organizations ADD COLUMN company_size VARCHAR(50);
ALTER TABLE organizations ADD COLUMN country VARCHAR(100);
ALTER TABLE organizations ADD COLUMN timezone VARCHAR(64) NOT NULL DEFAULT 'UTC';
ALTER TABLE organizations ADD COLUMN website VARCHAR(255);
ALTER TABLE organizations ADD COLUMN phone VARCHAR(50);
ALTER TABLE organizations ADD COLUMN default_currency VARCHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE organizations ADD COLUMN working_days VARCHAR(50) NOT NULL DEFAULT 'MON,TUE,WED,THU,FRI';
ALTER TABLE organizations ADD COLUMN work_start_time TIME NOT NULL DEFAULT TIME '09:00:00';
ALTER TABLE organizations ADD COLUMN work_end_time TIME NOT NULL DEFAULT TIME '17:00:00';

UPDATE organizations
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '.', ''))
WHERE slug IS NULL;

ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX uq_organizations_slug ON organizations (slug);

UPDATE organizations
SET company_email = 'admin@workfora.com',
    industry = 'Technology',
    company_size = '11-50',
    country = 'US',
    timezone = 'UTC'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- User email verification + home organization
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);

UPDATE users SET email_verified = TRUE
WHERE email IN ('admin@workfora.com', 'manager@workfora.com', 'employee@workfora.com');

UPDATE users u
SET organization_id = e.organization_id
FROM employees e
WHERE u.employee_id = e.id
  AND u.organization_id IS NULL;

CREATE INDEX idx_users_organization ON users(organization_id);

-- Organization memberships (supports future multi-org users)
CREATE TABLE organization_memberships (
    id               UUID PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_code        VARCHAR(50) NOT NULL,
    status           VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    is_primary       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by       UUID,
    updated_by       UUID,
    CONSTRAINT uq_membership_user_org UNIQUE (user_id, organization_id)
);

CREATE INDEX idx_memberships_user ON organization_memberships(user_id);
CREATE INDEX idx_memberships_org ON organization_memberships(organization_id);

INSERT INTO organization_memberships (
    id, user_id, organization_id, role_code, status, is_primary, created_at, updated_at
) VALUES
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '77777777-7777-7777-7777-777777777771',
  '11111111-1111-1111-1111-111111111111', 'SUPER_ADMIN', 'ACTIVE', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '77777777-7777-7777-7777-777777777772',
  '11111111-1111-1111-1111-111111111111', 'DEPT_MANAGER', 'ACTIVE', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '77777777-7777-7777-7777-777777777773',
  '11111111-1111-1111-1111-111111111111', 'EMPLOYEE', 'ACTIVE', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Email verification tokens (store hash only)
CREATE TABLE email_verification_tokens (
    id           UUID PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   VARCHAR(128) NOT NULL,
    expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at      TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by   UUID,
    updated_by   UUID
);

CREATE UNIQUE INDEX uq_email_verification_token_hash ON email_verification_tokens(token_hash);
CREATE INDEX idx_email_verification_user ON email_verification_tokens(user_id);

-- ORG_ADMIN role (organization-scoped admin; never PLATFORM / SUPER_ADMIN)
INSERT INTO roles (id, code, name, description, created_at, updated_at) VALUES
 ('b0000000-0000-0000-0000-000000000006', 'ORG_ADMIN', 'Organization Administrator',
  'Full administration within a single organization workspace', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'b0000000-0000-0000-0000-000000000006', id FROM permissions
WHERE code IN (
  'org:configure','employee:read','employee:write','attendance:read','attendance:write',
  'leave:read','leave:write','leave:approve','recruitment:read','recruitment:write',
  'onboarding:read','onboarding:write','payroll:read','payroll:write','performance:read',
  'performance:write','asset:read','asset:write','report:read','notification:read','dashboard:read'
);
