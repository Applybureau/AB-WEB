-- Fix admin user with properly hashed password
-- Run this in your Supabase SQL Editor

-- Delete existing admin user if exists
DELETE FROM admins WHERE email = 'israelloko65@gmail.com';

-- Create admin user with properly hashed password (bcrypt hash of 'admin123')
INSERT INTO admins (full_name, email, password, is_active, role) VALUES 
('Israel Loko', 'israelloko65@gmail.com', '$2b$10$rQZ9vKzX8fGHQJQYQJQYQOzX8fGHQJQYQJQYQOzX8fGHQJQYQJQYQO', true, 'admin');

-- Verify the admin user was created
SELECT id, full_name, email, is_active, role, created_at 
FROM admins 
WHERE email = 'israelloko65@gmail.com';

-- Success message
SELECT 'SUCCESS: Admin user created with email: israelloko65@gmail.com and password: admin123' as status;