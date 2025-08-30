-- Add username column to user_profiles table
-- Run this in your Supabase SQL editor

-- Add username column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create index on username for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Add unique constraint to ensure usernames are unique
-- Note: This will fail if there are existing duplicate usernames
-- You may need to clean up duplicates first
ALTER TABLE user_profiles 
ADD CONSTRAINT unique_username UNIQUE (username);

-- Update the handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, username, full_name, bio, location, website, instagram, avatar_url, banner_url, tags)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'Animal lover and advocate for wildlife conservation. Passionate about helping animals in need and supporting sanctuaries around the world.',
    'Portland, OR',
    'example.com',
    '@animal_lover',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://picsum.photos/seed/user/200'),
    'https://picsum.photos/seed/user-banner/1200/480',
    ARRAY['Animal Lover', 'Advocate', 'Volunteer']
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 