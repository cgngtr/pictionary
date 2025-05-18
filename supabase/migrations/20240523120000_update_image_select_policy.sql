-- File: 20240523120000_update_image_select_policy.sql

-- Drop the existing restrictive select policy on the public.images table
DROP POLICY IF EXISTS "Users can view their own images" ON public.images;

-- Create a new policy to allow any authenticated user to view all images
-- This policy grants SELECT permission to any user who is part of the 'authenticated' role.
-- The USING (true) clause means that for any row, this condition is met,
-- effectively allowing selection of all rows for users in the 'authenticated' role.
CREATE POLICY "Authenticated users can view all images"
ON public.images
FOR SELECT
TO authenticated
USING (true);

-- Re-affirm INSERT policy: Users can insert their own images.
-- The previous policy "Users can insert their own images" is dropped and recreated
-- to ensure its definition is consolidated here and is clear.
DROP POLICY IF EXISTS "Users can insert their own images" ON public.images;
CREATE POLICY "Users can insert their own images"
ON public.images
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Re-affirm UPDATE policy: Users can update their own images.
DROP POLICY IF EXISTS "Users can update their own images" ON public.images;
CREATE POLICY "Users can update their own images"
ON public.images
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Re-affirm DELETE policy: Users can delete their own images.
DROP POLICY IF EXISTS "Users can delete their own images" ON public.images;
CREATE POLICY "Users can delete their own images"
ON public.images
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Note on the 'is_public' column in the 'images' table:
-- With the new "Authenticated users can view all images" SELECT policy,
-- the 'is_public' field is no longer the primary controller for general visibility
-- among authenticated users. All images will be visible to them.
-- You might consider if 'is_public' still has a purpose (e.g., for access by unauthenticated users
-- if you add a separate policy for them, or for other application logic) or if it can be deprecated/removed
-- in a future migration if it's now redundant. 