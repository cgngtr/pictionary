-- Storage bucket için genel erişim politikası
-- Önceki karmaşık RLS politikaları yerine tek bir "herkese açık" politika

-- Tüm mevcut storage RLS politikalarını kaldır (eğer varsa)
DROP POLICY IF EXISTS "Anyone can read public images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public access to images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Full public access to all storage objects" ON storage.objects;

-- Herkesin her şeyi yapabilmesine izin veren tek bir politika ekle
-- RLS on storage.objects will be implicitly enabled by the presence of this policy.
CREATE POLICY "Full public access to all storage objects" 
ON storage.objects FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS Policies for storage.buckets table
-- REMOVED: The DO $$ block that attempted to ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
-- We will attempt this via a separate RPC call from the application if direct DDL fails.

-- Policies for storage.buckets are removed as RLS is not being enabled on this table
-- to avoid permission errors.

-- RPC function to attempt enabling RLS on storage.buckets (REMOVED)
/*
-- Ensure this entire block is commented out or deleted.
CREATE OR REPLACE FUNCTION ensure_rls_on_storage_buckets()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  original_role TEXT;
  admin_role_used TEXT; -- Generic admin role
BEGIN
  SELECT current_user INTO original_role;
  admin_role_used := NULL;

  RAISE NOTICE '[ensure_rls_on_storage_buckets] Attempting to set role.';
  BEGIN
    EXECUTE 'SET ROLE supabase_storage_admin';
    admin_role_used := 'supabase_storage_admin';
    RAISE NOTICE '[ensure_rls_on_storage_buckets] Successfully SET ROLE to supabase_storage_admin';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '[ensure_rls_on_storage_buckets] Failed to SET ROLE to supabase_storage_admin (%), attempting supabase_admin...', SQLERRM;
      BEGIN
        EXECUTE 'SET ROLE supabase_admin';
        admin_role_used := 'supabase_admin';
        RAISE NOTICE '[ensure_rls_on_storage_buckets] Successfully SET ROLE to supabase_admin';
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING '[ensure_rls_on_storage_buckets] Failed to SET ROLE to supabase_admin (%). Proceeding as original role (%). Error for ALTER TABLE might occur.', SQLERRM, original_role;
      END;
  END;

  RAISE NOTICE '[ensure_rls_on_storage_buckets] Attempting to ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY as role %', current_user;
  BEGIN
    ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '[ensure_rls_on_storage_buckets] Successfully enabled RLS on storage.buckets';
    IF admin_role_used IS NOT NULL THEN EXECUTE 'SET ROLE ' || quote_ident(original_role); END IF;
    RETURN json_build_object('success', true, 'message', 'RLS successfully enabled on storage.buckets.');
  EXCEPTION
    WHEN insufficient_privilege THEN -- Catches 42501 errors specifically
      RAISE WARNING '[ensure_rls_on_storage_buckets] Insufficient privilege to ENABLE RLS on storage.buckets (%). RLS on storage.buckets might remain disabled.', SQLERRM;
      IF admin_role_used IS NOT NULL THEN EXECUTE 'SET ROLE ' || quote_ident(original_role); END IF;
      RETURN json_build_object('success', false, 'message', 'Insufficient privilege to enable RLS on storage.buckets: ' || SQLERRM);
    WHEN OTHERS THEN
      RAISE WARNING '[ensure_rls_on_storage_buckets] Other error enabling RLS on storage.buckets: %', SQLERRM;
      IF admin_role_used IS NOT NULL AND current_user != original_role THEN EXECUTE 'SET ROLE ' || quote_ident(original_role); END IF;
      RETURN json_build_object('success', false, 'message', 'Other error enabling RLS on storage.buckets: ' || SQLERRM);
  END;
END;
$$
SET search_path = public, storage, extensions; 
*/

-- Updated RPC function (renamed and simplified)
-- Its only job is to ensure the 'images' bucket is public.
CREATE OR REPLACE FUNCTION manage_images_bucket_publicity() 
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  original_role TEXT;
  storage_admin_role_used TEXT;
BEGIN
  SELECT current_user INTO original_role;
  storage_admin_role_used := NULL;

  BEGIN
    EXECUTE 'SET ROLE supabase_storage_admin';
    storage_admin_role_used := 'supabase_storage_admin';
    RAISE NOTICE '[manage_images_bucket_publicity] Successfully SET ROLE to supabase_storage_admin';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '[manage_images_bucket_publicity] Failed to SET ROLE to supabase_storage_admin (%), attempting supabase_admin...', SQLERRM;
      BEGIN
        EXECUTE 'SET ROLE supabase_admin';
        storage_admin_role_used := 'supabase_admin';
        RAISE NOTICE '[manage_images_bucket_publicity] Successfully SET ROLE to supabase_admin';
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING '[manage_images_bucket_publicity] Failed to SET ROLE to supabase_admin (%). Proceeding as original role (%). Error for UPDATE storage.buckets might occur.', SQLERRM, original_role;
      END;
  END;

  -- Only make the 'images' bucket public. 
  -- NO ALTER TABLE RLS COMMANDS.
  RAISE NOTICE '[manage_images_bucket_publicity] Attempting to UPDATE storage.buckets SET public = true WHERE name = ''images'' as role %', current_user;
  UPDATE storage.buckets SET public = true WHERE name = 'images';
  RAISE NOTICE '[manage_images_bucket_publicity] Successfully ensured images bucket is public (if it exists)';
  
  IF storage_admin_role_used IS NOT NULL THEN
    EXECUTE 'SET ROLE ' || quote_ident(original_role);
    RAISE NOTICE '[manage_images_bucket_publicity] Successfully reverted ROLE to %', original_role;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Images bucket ensured to be public.');
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING '[manage_images_bucket_publicity] Error: %', SQLERRM;
    IF storage_admin_role_used IS NOT NULL AND current_user != original_role THEN
      BEGIN
        EXECUTE 'SET ROLE ' || quote_ident(original_role);
        RAISE NOTICE '[manage_images_bucket_publicity] Successfully reverted ROLE to % after error', original_role;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING '[manage_images_bucket_publicity] Failed to reset role to % after error: %', original_role, SQLERRM;
      END;
    END IF;
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$
SET search_path = public, storage, extensions; 

-- Bucket yok ise oluştur (public olarak)
DO $$
BEGIN
  -- Check if the images bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'images'
  ) THEN
    RAISE NOTICE '[Migration DO block] Bucket "images" does not exist. Creating it as public.';
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES ('images', 'images', true, false, 52428800, null);
  ELSE
    RAISE NOTICE '[Migration DO block] Bucket "images" already exists. Ensuring it is public.';
    -- Bucket varsa, public olarak ayarla (idempotent)
    UPDATE storage.buckets SET public = true WHERE name = 'images';
  END IF;
END $$; 

--
-- RLS Policies for the custom 'users' table
--

-- Enable Row Level Security for the 'users' table if not already enabled
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY; -- This line is redundant, RLS enabled in create_tables.sql

-- Remove existing policies if they might conflict (optional, uncomment if needed)
-- DROP POLICY IF EXISTS "Allow individual user insert" ON public.users; -- This line and the following DROP lines should remain commented unless explicitly needed
-- DROP POLICY IF EXISTS "Allow individual user select" ON public.users;
-- DROP POLICY IF EXISTS "Allow individual user update" ON public.users;
-- DROP POLICY IF EXISTS "Allow individual user delete" ON public.users;

-- Policy: Allow users to insert their own record into the 'users' table.
-- The 'id' in the 'users' table must match the authenticated user's ID.
CREATE POLICY "Allow individual user insert"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Allow users to select their own record from the 'users' table.
DROP POLICY IF EXISTS "Allow individual user select" ON public.users;
CREATE POLICY "Allow authenticated users to select user data"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow users to update their own record in the 'users' table.
CREATE POLICY "Allow individual user update"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: (Optional) Allow users to delete their own record from the 'users' table.
-- Consider if users should be able to delete their own 'users' table entry.
-- This does NOT delete their auth.users entry.
CREATE POLICY "Allow individual user delete"
ON public.users
FOR DELETE
TO authenticated
USING (auth.uid() = id); 

--
-- RLS Policies for the custom 'profiles' table
--

-- Enable Row Level Security for the 'profiles' table
-- Assuming 'profiles' table is created in '20240320000001_create_tables.sql'
-- If RLS is already enabled there, this line is redundant but harmless.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if they might conflict (optional, uncomment if needed)
-- DROP POLICY IF EXISTS "Allow individual profile insert" ON public.profiles;
-- DROP POLICY IF EXISTS "Allow authenticated users to select profile data" ON public.profiles;
-- DROP POLICY IF EXISTS "Allow individual profile update" ON public.profiles;
-- DROP POLICY IF EXISTS "Allow individual profile delete" ON public.profiles;

-- Policy: Allow users to insert their own record into the 'profiles' table.
-- The 'user_id' in the 'profiles' table must match the authenticated user's ID.
DROP POLICY IF EXISTS "Allow individual profile insert" ON public.profiles;
CREATE POLICY "Allow individual profile insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow authenticated users to select any profile data from the 'profiles' table.
DROP POLICY IF EXISTS "Allow authenticated users to select profile data" ON public.profiles;
CREATE POLICY "Allow authenticated users to select profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (true); -- Allows any authenticated user to read any profile

-- Policy: Allow users to update their own record in the 'profiles' table.
DROP POLICY IF EXISTS "Allow individual profile update" ON public.profiles;
CREATE POLICY "Allow individual profile update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to delete their own record from the 'profiles' table.
DROP POLICY IF EXISTS "Allow individual profile delete" ON public.profiles;
CREATE POLICY "Allow individual profile delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 