-- Demo users documented in README: password Admin123!
-- V2 used a placeholder BCrypt hash that did not match that password.

UPDATE users
SET password_hash = '$2a$10$Mqv2AyysBkmFx147mTHmbetBAA/XG9v3ncmZLJQKG0DMDajp.lQLS',
    updated_at = CURRENT_TIMESTAMP
WHERE email IN (
  'admin@workfora.com',
  'manager@workfora.com',
  'employee@workfora.com'
);