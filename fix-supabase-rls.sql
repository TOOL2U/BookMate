-- Fix Supabase RLS Policies for BookMate Production
-- This allows the connection pooler and service role to access the users table

-- Disable RLS on users table (for serverless/connection pooler compatibility)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, use these policies instead:
-- (Comment out the ALTER TABLE above and uncomment below)

/*
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for backend API calls)
CREATE POLICY "Allow service role full access to users"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to read their own data
CREATE POLICY "Users can view own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id::text);

-- Allow authenticated users to update their own data
CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id::text)
WITH CHECK (auth.uid() = id::text);
*/

-- Verify the change
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';
