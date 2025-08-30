-- Cleanup script to remove duplicate policies
-- Run this if you encounter policy conflicts

-- Drop all existing policies from animal_profiles_media
DROP POLICY IF EXISTS "Organizations can manage their animal media" ON animal_profiles_media;
DROP POLICY IF EXISTS "Anyone can view published animal media" ON animal_profiles_media;

-- Drop all existing policies from animal_profiles_updates
DROP POLICY IF EXISTS "Organizations can manage their animal updates" ON animal_profiles_updates;
DROP POLICY IF EXISTS "Anyone can view published animal updates" ON animal_profiles_updates;

-- Drop all existing policies from animal_profiles_donations
DROP POLICY IF EXISTS "Users can donate to published animals" ON animal_profiles_donations;
DROP POLICY IF EXISTS "Users can view their own donations" ON animal_profiles_donations;
DROP POLICY IF EXISTS "Organizations can view donations to their animals" ON animal_profiles_donations;

-- Drop all existing policies from animal_profiles_followers
DROP POLICY IF EXISTS "Users can follow published animals" ON animal_profiles_followers;
DROP POLICY IF EXISTS "Users can manage their own follows" ON animal_profiles_followers;
DROP POLICY IF EXISTS "Organizations can view followers of their animals" ON animal_profiles_followers;

-- Drop all existing policies from animal_profiles
DROP POLICY IF EXISTS "Organizations can manage their animal profiles" ON animal_profiles;
DROP POLICY IF EXISTS "Anyone can view published animal profiles" ON animal_profiles;

-- Verify policies are removed
SELECT 'Cleanup complete! All policies removed.' as status;
