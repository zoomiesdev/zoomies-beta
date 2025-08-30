-- Add user_type column to user_profiles table
-- This distinguishes between individual users and organizations

-- Add the user_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'user_type'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN user_type VARCHAR(20) DEFAULT 'individual';
    END IF;
END $$;

-- Add check constraint to ensure valid user types
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_profiles_user_type_check'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_type_check
        CHECK (user_type IN ('individual', 'organization'));
    END IF;
END $$;

-- Add index on user_type for faster queries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_user_profiles_user_type'
    ) THEN
        CREATE INDEX idx_user_profiles_user_type ON user_profiles (user_type);
    END IF;
END $$;

-- Update existing profiles to have 'individual' as default user_type
UPDATE user_profiles 
SET user_type = 'individual' 
WHERE user_type IS NULL;

-- Make user_type NOT NULL after setting default values
ALTER TABLE user_profiles ALTER COLUMN user_type SET NOT NULL;

-- Verify the changes were applied
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'user_type';

