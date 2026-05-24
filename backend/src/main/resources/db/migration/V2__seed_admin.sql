-- Seed default super admin user
-- Password: admin123 (BCrypt hash — verified correct)
-- IMPORTANT: Change password immediately after first login!
INSERT INTO users (id, username, email, password_hash, role, enabled, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'admin@panel.local',
    '$2a$10$/SGEPBqlhEVu.xxQawXlpeRnOejM/6zrzHmjxN.FF/LVhDvMdLfsS',
    'SUPER_ADMIN',
    TRUE,
    NOW()
) ON CONFLICT (username) DO NOTHING;
