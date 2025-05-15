-- Add title and description columns to images table if they don't exist
ALTER TABLE images ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE images ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing records with default values
UPDATE images SET title = 'Untitled' WHERE title IS NULL;

-- Make title NOT NULL as in original design
ALTER TABLE images ALTER COLUMN title SET NOT NULL; 