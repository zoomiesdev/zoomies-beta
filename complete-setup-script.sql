-- Complete Setup Script for Animal Profiles System
-- This script ensures all required tables exist and are properly configured

-- Step 1: Ensure user_profiles table exists
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    user_type VARCHAR(20) DEFAULT 'individual' CHECK (user_type IN ('individual', 'organization')),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create animal_profiles table with proper foreign key
CREATE TABLE IF NOT EXISTS animal_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age VARCHAR(50),
    bio TEXT,
    story TEXT,
    goal DECIMAL(10,2) NOT NULL DEFAULT 0,
    raised DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'draft')),
    featured BOOLEAN DEFAULT false,
    image_url TEXT,
    banner_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create supporting tables
CREATE TABLE IF NOT EXISTS animal_profiles_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES animal_profiles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS animal_profiles_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES animal_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS animal_profiles_donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES animal_profiles(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS animal_profiles_followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES animal_profiles(id) ON DELETE CASCADE,
    follower_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(animal_id, follower_id)
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_organization_id ON animal_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_status ON animal_profiles(status);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_media_animal_id ON animal_profiles_media(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_updates_animal_id ON animal_profiles_updates(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_donations_animal_id ON animal_profiles_donations(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_donations_donor_id ON animal_profiles_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_followers_animal_id ON animal_profiles_followers(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_followers_follower_id ON animal_profiles_followers(follower_id);

-- Step 5: Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_profiles_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_profiles_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_profiles_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_profiles_followers ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies safely
-- Users can view and edit their own profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can manage their own profiles'
    ) THEN
        CREATE POLICY "Users can manage their own profiles" ON user_profiles
            FOR ALL USING (user_id = auth.uid());
    END IF;
END $$;

-- Anyone can view user profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Anyone can view user profiles'
    ) THEN
        CREATE POLICY "Anyone can view user profiles" ON user_profiles
            FOR SELECT USING (true);
    END IF;
END $$;

-- Organizations can manage their own animal profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles' 
        AND policyname = 'Organizations can manage their animal profiles'
    ) THEN
        CREATE POLICY "Organizations can manage their animal profiles" ON animal_profiles
            FOR ALL USING (organization_id = auth.uid());
    END IF;
END $$;

-- Anyone can view published animal profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles' 
        AND policyname = 'Anyone can view published animal profiles'
    ) THEN
        CREATE POLICY "Anyone can view published animal profiles" ON animal_profiles
            FOR SELECT USING (status != 'draft');
    END IF;
END $$;

-- Organizations can manage their animal media
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles_media' 
        AND policyname = 'Organizations can manage their animal media'
    ) THEN
        CREATE POLICY "Organizations can manage their animal media" ON animal_profiles_media
            FOR ALL USING (
                animal_id IN (
                    SELECT id FROM animal_profiles WHERE organization_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Anyone can view published animal media
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles_media' 
        AND policyname = 'Anyone can view published animal media'
    ) THEN
        CREATE POLICY "Anyone can view published animal media" ON animal_profiles_media
            FOR SELECT USING (
                animal_id IN (
                    SELECT id FROM animal_profiles WHERE status != 'draft'
                )
            );
    END IF;
END $$;

-- Organizations can manage their animal updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles_updates' 
        AND policyname = 'Organizations can manage their animal updates'
    ) THEN
        CREATE POLICY "Organizations can manage their animal updates" ON animal_profiles_updates
            FOR ALL USING (
                animal_id IN (
                    SELECT id FROM animal_profiles WHERE organization_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Anyone can view published animal updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles_updates' 
        AND policyname = 'Anyone can view published animal updates'
    ) THEN
        CREATE POLICY "Anyone can view published animal updates" ON animal_profiles_updates
            FOR SELECT USING (
                animal_id IN (
                    SELECT id FROM animal_profiles WHERE status != 'draft'
                )
            );
    END IF;
END $$;

-- Users can make donations to any published animal
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles_donations' 
        AND policyname = 'Users can donate to published animals'
    ) THEN
        CREATE POLICY "Users can donate to published animals" ON animal_profiles_donations
            FOR INSERT WITH CHECK (
                animal_id IN (
                    SELECT id FROM animal_profiles WHERE status != 'draft'
                )
            );
    END IF;
END $$;

-- Users can view their own donations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles_donations' 
        AND policyname = 'Users can view their own donations'
    ) THEN
        CREATE POLICY "Users can view their own donations" ON animal_profiles_donations
            FOR SELECT USING (donor_id = auth.uid());
    END IF;
END $$;

-- Organizations can view donations to their animals
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles_donations' 
        AND policyname = 'Organizations can view donations to their animals'
    ) THEN
        CREATE POLICY "Organizations can view donations to their animals" ON animal_profiles_donations
            FOR SELECT USING (
                animal_id IN (
                    SELECT id FROM animal_profiles WHERE organization_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Users can follow/unfollow published animals
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles_followers' 
        AND policyname = 'Users can follow published animals'
    ) THEN
        CREATE POLICY "Users can follow published animals" ON animal_profiles_followers
            FOR ALL USING (
                animal_id IN (
                    SELECT id FROM animal_profiles WHERE status != 'draft'
                )
            );
    END IF;
END $$;

-- Users can manage their own follows
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles_followers' 
        AND policyname = 'Users can manage their own follows'
    ) THEN
        CREATE POLICY "Users can manage their own follows" ON animal_profiles_followers
            FOR ALL USING (follower_id = auth.uid());
    END IF;
END $$;

-- Organizations can view followers of their animals
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles_followers' 
        AND policyname = 'Organizations can view followers of their animals'
    ) THEN
        CREATE POLICY "Organizations can view followers of their animals" ON animal_profiles_followers
            FOR SELECT USING (
                animal_id IN (
                    SELECT id FROM animal_profiles WHERE status != 'draft'
                )
            );
    END IF;
END $$;

-- Step 7: Verify setup
SELECT 'Setup complete! All tables and policies created successfully.' as status;

