-- Drop the function get_user_saved_pins
DROP FUNCTION IF EXISTS get_user_saved_pins(user_uuid UUID);

-- Drop RLS policies for saved_pins table
DROP POLICY IF EXISTS "Users can delete their own saved pins" ON saved_pins;
DROP POLICY IF EXISTS "Users can insert their own saved pins" ON saved_pins;
DROP POLICY IF EXISTS "Users can view their own saved pins" ON saved_pins;

-- Drop indexes on saved_pins
DROP INDEX IF EXISTS idx_saved_pins_image_id;
DROP INDEX IF EXISTS idx_saved_pins_user_id;

-- Drop saved_pins table
DROP TABLE IF EXISTS saved_pins CASCADE;

-- Revert images table policies

-- First, drop the policy that allowed viewing all public images or their own
CREATE POLICY "Users can view all public images or their own" ON images;

-- Then, recreate the original policy: "Users can view their own images"
-- (Assuming this was the state before the 'add_saved_pins_table' migration)
CREATE POLICY "Users can view their own images"
    ON images FOR SELECT
    USING (auth.uid() = user_id);

-- Note: If RLS was not previously enabled on the 'images' table, 
-- and was enabled specifically by the policy we are reverting, 
-- you might need to consider "ALTER TABLE images DISABLE ROW LEVEL SECURITY;".
-- However, typically RLS is enabled when the table is created or policies are first applied.
-- The provided migration for saved_pins only modified existing policies on 'images',
-- suggesting RLS on 'images' was already active. 