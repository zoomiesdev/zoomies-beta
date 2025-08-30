-- Ensure current user has a profile
-- Run this after the complete setup script

-- First, check if user_profiles table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
    ) THEN
        RAISE EXCEPTION 'user_profiles table does not exist. Please run the complete-setup-script.sql first.';
    END IF;
END $$;

-- Check if current user has a profile
DO $$
DECLARE
    current_user_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found. Please log in first.';
    END IF;
    
    -- Check if profile exists
    SELECT EXISTS(
        SELECT 1 FROM user_profiles WHERE user_id = current_user_id
    ) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Create a profile for the current user
        INSERT INTO user_profiles (
            user_id, 
            username, 
            full_name, 
            user_type
        ) VALUES (
            current_user_id,
            'user_' || SUBSTRING(current_user_id::text, 1, 8),
            COALESCE(auth.jwt() ->> 'user_metadata' ->> 'full_name', 'User'),
            COALESCE(auth.jwt() ->> 'user_metadata' ->> 'user_type', 'individual')
        );
        
        RAISE NOTICE 'Created profile for user %', current_user_id;
    ELSE
        RAISE NOTICE 'Profile already exists for user %', current_user_id;
    END IF;
END $$;

-- Verify the current user's profile
SELECT 
    user_id,
    username,
    full_name,
    user_type,
    created_at
FROM user_profiles 
WHERE user_id = auth.uid();

