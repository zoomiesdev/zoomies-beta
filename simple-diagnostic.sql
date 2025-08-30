-- Simple Diagnostic Script
-- This will show you exactly what's missing

-- 1. Check if user_profiles table exists
SELECT 
    'user_profiles' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
        THEN 'EXISTS' 
        ELSE 'MISSING - NEEDS SETUP' 
    END as status;

-- 2. Check if animal_profiles table exists
SELECT 
    'animal_profiles' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'animal_profiles') 
        THEN 'EXISTS' 
        ELSE 'MISSING - NEEDS SETUP' 
    END as status;

-- 3. Check if you're logged in
SELECT 
    'Authentication' as check_type,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'LOGGED IN - User ID: ' || auth.uid()
        ELSE 'NOT LOGGED IN' 
    END as status;

-- 4. Check if you have a user profile (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid()) THEN
            RAISE NOTICE '✅ You have a user profile in user_profiles table';
        ELSE
            RAISE NOTICE '❌ You do NOT have a user profile in user_profiles table';
        END IF;
    ELSE
        RAISE NOTICE '❌ user_profiles table does not exist - run setup script first';
    END IF;
END $$;

-- 5. Show what you need to do
SELECT 
    'ACTION REQUIRED' as message,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
        THEN 'Run complete-setup-script.sql in Supabase SQL Editor'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'animal_profiles') 
        THEN 'Run complete-setup-script.sql in Supabase SQL Editor'
        WHEN NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid()) 
        THEN 'Your user profile is missing - refresh dashboard or run ensure-user-profile.sql'
        ELSE 'All tables exist - try creating animal profile again'
    END as next_step;

