-- Fix admin user with properly hashed password
-- Run this in your Supabase SQL Editor

DELETE FROM admins WHERE email = 'israelloko65@gmail.com';

INSERT INTO admins (full_name, email, password, is_active, role) VALUES 
('Israel Loko', 'israelloko65@gmail.com', '$2a$10$2QCwQKgE8DR9C7q748wsY.IXnMAtQvgXlRXIsgDow4tajW9ifyGbC', true, 'admin');

-- Verify the admin user was created
SELECT id, full_name, email, is_active, role, created_at 
FROM admins 
WHERE email = 'israelloko65@gmail.com';

SELECT 'SUCCESS: Admin user fixed! Login with israelloko65@gmail.com / admin123' as status;