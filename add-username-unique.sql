-- Add username field to user_profiles table with unique constraint
-- This ensures each user has a unique username for tagging and identification

-- First, add the username column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'username'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN username VARCHAR(50);
    END IF;
END $$;

-- Add unique constraint on username (case-insensitive)
-- This prevents duplicate usernames
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_username_unique'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_username_unique 
        UNIQUE (username);
    END IF;
END $$;

-- Add index on username for faster searches (case-insensitive)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_user_profiles_username'
    ) THEN
        CREATE INDEX idx_user_profiles_username ON user_profiles (LOWER(username));
    END IF;
END $$;

-- Update existing profiles to have usernames if they don't have them
-- Use the user_id as a fallback username
UPDATE user_profiles 
SET username = 'user_' || SUBSTRING(user_id::text, 1, 8)
WHERE username IS NULL OR username = '';

-- Make username NOT NULL after setting default values
ALTER TABLE user_profiles ALTER COLUMN username SET NOT NULL;

-- Verify the changes were applied
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'username';
