-- Drop database table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

DROP POLICY IF EXISTS "Users can view their own profile information" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile information" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile information" ON profiles;

DROP POLICY IF EXISTS "Users can view their own images" ON images;
DROP POLICY IF EXISTS "Users can insert their own images" ON images;
DROP POLICY IF EXISTS "Users can update their own images" ON images;
DROP POLICY IF EXISTS "Users can delete their own images" ON images;

-- Drop storage policies
DROP POLICY IF EXISTS "Anyone can read public images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public access to images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Full public access to all storage objects" ON storage.objects;


-- Drop all tables and related objects
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;