-- SQL script to reset password for shaun@siamoon.com
-- Password: Alesiamay231!
-- Hash generated with bcrypt (10 rounds)

-- STEP 1: Get the user ID first
SELECT id, email, "failedLoginCount", "lockedUntil", status 
FROM users 
WHERE email = 'shaun@siamoon.com';

-- STEP 2: Update the password (replace YOUR_USER_ID with the ID from step 1)
-- The hash below is for password: Alesiamay231!
UPDATE users 
SET 
  "passwordHash" = '$2a$10$rZHVXMJK9qGx8GzLzqP0AuFQ9mK7JXmH8kZC5YfZJTYp8V3xH9h7W',
  "failedLoginCount" = 0,
  "lockedUntil" = NULL,
  status = 'active'
WHERE email = 'shaun@siamoon.com';

-- STEP 3: Verify the update
SELECT id, email, "failedLoginCount", "lockedUntil", status, 
       LEFT("passwordHash", 20) || '...' as password_hash_preview
FROM users 
WHERE email = 'shaun@siamoon.com';
