-- Diagnostic Check Script (Fixed Version)
-- Run this to see what's missing in your database

-- Check if tables exist
SELECT 
    'Tables Status' as check_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (
    SELECT 'user_profiles' as table_name
    UNION ALL SELECT 'animal_profiles'
    UNION ALL SELECT 'animal_profiles_media'
    UNION ALL SELECT 'animal_profiles_updates'
    UNION ALL SELECT 'animal_profiles_donations'
    UNION ALL SELECT 'animal_profiles_followers'
) t
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = t.table_name
);

-- Check if user_profiles table exists and has data
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
    ) THEN
        RAISE NOTICE 'user_profiles table EXISTS';
        
        -- Check if it has any data
        IF EXISTS (SELECT 1 FROM user_profiles LIMIT 1) THEN
            RAISE NOTICE 'user_profiles table has data';
        ELSE
            RAISE NOTICE 'user_profiles table is EMPTY';
        END IF;
        
        -- Show table structure
        RAISE NOTICE 'user_profiles columns: %', (
            SELECT string_agg(column_name || ' ' || data_type, ', ')
            FROM information_schema.columns
            WHERE table_name = 'user_profiles'
        );
    ELSE
        RAISE NOTICE 'user_profiles table is MISSING';
    END IF;
END $$;

-- Check if animal_profiles table exists and has structure
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'animal_profiles'
    ) THEN
        RAISE NOTICE 'animal_profiles table EXISTS';
        
        -- Show table structure
        RAISE NOTICE 'animal_profiles columns: %', (
            SELECT string_agg(column_name || ' ' || data_type, ', ')
            FROM information_schema.columns
            WHERE table_name = 'animal_profiles'
        );
        
        -- Check foreign key constraints (simplified)
        RAISE NOTICE 'Foreign key constraints: %', (
            SELECT string_agg(constraint_name, ', ')
            FROM information_schema.table_constraints c
            WHERE c.table_name = 'animal_profiles' 
            AND c.constraint_type = 'FOREIGN KEY'
        );
    ELSE
        RAISE NOTICE 'animal_profiles table is MISSING';
    END IF;
END $$;

-- Check current user authentication
DO $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        RAISE NOTICE 'Current user ID: %', auth.uid();
        RAISE NOTICE 'Current user email: %', auth.jwt() ->> 'email';
        RAISE NOTICE 'User metadata: %', auth.jwt() ->> 'user_metadata';
    ELSE
        RAISE NOTICE 'No authenticated user found';
    END IF;
END $$;

-- Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    tablename,
    policyname,
    CASE 
        WHEN policyname IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (
    SELECT 'user_profiles' as tablename, 'Users can manage their own profiles' as policyname
    UNION ALL SELECT 'animal_profiles', 'Organizations can manage their animal profiles'
    UNION ALL SELECT 'animal_profiles', 'Anyone can view published animal profiles'
) t
WHERE EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = t.tablename 
    AND policyname = t.policyname
);

-- Summary
SELECT 'DIAGNOSTIC COMPLETE' as message;

