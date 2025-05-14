-- Drop all tables and related objects
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Disable Row Level Security on tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'images') THEN
    ALTER TABLE images DISABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Drop policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own images" ON images;
DROP POLICY IF EXISTS "Users can insert their own images" ON images;
DROP POLICY IF EXISTS "Users can update their own images" ON images;
DROP POLICY IF EXISTS "Users can delete their own images" ON images; 