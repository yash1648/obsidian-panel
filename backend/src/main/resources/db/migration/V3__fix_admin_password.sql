-- Fix admin password hash (V2 had a placeholder hash that didn't match "admin123")
-- This ensures existing databases get the correct hash without needing a reset.
UPDATE users
SET password_hash = '$2a$10$/SGEPBqlhEVu.xxQawXlpeRnOejM/6zrzHmjxN.FF/LVhDvMdLfsS'
WHERE username = 'admin' AND password_hash != '$2a$10$/SGEPBqlhEVu.xxQawXlpeRnOejM/6zrzHmjxN.FF/LVhDvMdLfsS';
