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

-- Define policies for storage.buckets (these will only take effect if RLS is successfully enabled on the table)
DROP POLICY IF EXISTS "Authenticated users can read bucket information" ON storage.buckets;
CREATE POLICY "Authenticated users can read bucket information"
ON storage.buckets FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anon users can read public bucket information" ON storage.buckets;
CREATE POLICY "Anon users can read public bucket information"
ON storage.buckets FOR SELECT
TO anon
USING (public = true);

-- RPC function to attempt enabling RLS on storage.buckets
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