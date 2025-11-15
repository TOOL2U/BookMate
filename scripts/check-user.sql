-- Check current password hash for shaun@siamoon.com
SELECT 
  id, 
  email, 
  LEFT(password_hash, 30) || '...' as password_hash_preview,
  failed_login_count,
  locked_until,
  status,
  created_at,
  updated_at
FROM users 
WHERE email = 'shaun@siamoon.com';
