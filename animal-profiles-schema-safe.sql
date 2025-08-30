-- Animal Profiles Schema for Organizations (Safe Version)
-- This script handles existing objects gracefully and won't fail if run multiple times

-- Create animal_profiles table if it doesn't exist
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

-- Create animal_profiles_media table if it doesn't exist
CREATE TABLE IF NOT EXISTS animal_profiles_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES animal_profiles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create animal_profiles_updates table if it doesn't exist
CREATE TABLE IF NOT EXISTS animal_profiles_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES animal_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create animal_profiles_donations table if it doesn't exist
CREATE TABLE IF NOT EXISTS animal_profiles_donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES animal_profiles(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create animal_profiles_followers table if it doesn't exist
CREATE TABLE IF NOT EXISTS animal_profiles_followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES animal_profiles(id) ON DELETE CASCADE,
    follower_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(animal_id, follower_id)
);

-- Create indexes safely
CREATE INDEX IF NOT EXISTS idx_animal_profiles_organization_id ON animal_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_status ON animal_profiles(status);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_featured ON animal_profiles(featured);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_created_at ON animal_profiles(created_at);

CREATE INDEX IF NOT EXISTS idx_animal_profiles_media_animal_id ON animal_profiles_media(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_updates_animal_id ON animal_profiles_updates(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_donations_animal_id ON animal_profiles_donations(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_donations_donor_id ON animal_profiles_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_donations_created_at ON animal_profiles_donations(created_at);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_followers_animal_id ON animal_profiles_followers(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_followers_follower_id ON animal_profiles_followers(follower_id);

-- Create function safely
CREATE OR REPLACE FUNCTION update_animal_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_animal_profiles_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_animal_profiles_updated_at
            BEFORE UPDATE ON animal_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_animal_profiles_updated_at();
    END IF;
END $$;

-- Create helper functions safely
CREATE OR REPLACE FUNCTION get_animal_total_raised(animal_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total
    FROM animal_profiles_donations
    WHERE animal_id = animal_uuid;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_animal_stats(animal_uuid UUID)
RETURNS TABLE(
    total_donors BIGINT,
    total_raised DECIMAL(10,2),
    follower_count BIGINT,
    update_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT d.donor_id)::BIGINT as total_donors,
        COALESCE(SUM(d.amount), 0) as total_raised,
        COUNT(f.follower_id)::BIGINT as follower_count,
        COUNT(u.id)::BIGINT as update_count
    FROM animal_profiles a
    LEFT JOIN animal_profiles_donations d ON a.id = d.animal_id
    LEFT JOIN animal_profiles_followers f ON a.id = f.animal_id
    LEFT JOIN animal_profiles_updates u ON a.id = u.animal_id
    WHERE a.id = animal_uuid
    GROUP BY a.id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security safely
ALTER TABLE animal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_profiles_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_profiles_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_profiles_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_profiles_followers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies safely
DO $$
BEGIN
    -- Organizations can manage their own animal profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles' 
        AND policyname = 'Organizations can manage their animal profiles'
    ) THEN
        CREATE POLICY "Organizations can manage their animal profiles" ON animal_profiles
            FOR ALL USING (organization_id = auth.uid());
    END IF;
    
    -- Anyone can view published animal profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles' 
        AND policyname = 'Anyone can view published animal profiles'
    ) THEN
        CREATE POLICY "Anyone can view published animal profiles" ON animal_profiles
            FOR SELECT USING (status != 'draft');
    END IF;
    
    -- Organizations can manage their animal media
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
    
    -- Anyone can view published animal media
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
    
    -- Organizations can manage their animal updates
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
    
    -- Anyone can view published animal updates
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
    
    -- Users can make donations to any published animal
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
    
    -- Users can view their own donations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles_donations' 
        AND policyname = 'Users can view their own donations'
    ) THEN
        CREATE POLICY "Users can view their own donations" ON animal_profiles_donations
            FOR SELECT USING (donor_id = auth.uid());
    END IF;
    
    -- Organizations can view donations to their animals
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
    
    -- Users can follow/unfollow published animals
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
    
    -- Users can manage their own follows
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles_followers' 
        AND policyname = 'Users can manage their own follows'
    ) THEN
        CREATE POLICY "Users can manage their own follows" ON animal_profiles_followers
            FOR ALL USING (follower_id = auth.uid());
    END IF;
    
    -- Organizations can view followers of their animals
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'animal_profiles_followers' 
        AND policyname = 'Organizations can view followers of their animals'
    ) THEN
        CREATE POLICY "Organizations can view followers of their animals" ON animal_profiles_followers
            FOR SELECT USING (
                animal_id IN (
                    SELECT id FROM animal_profiles WHERE organization_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Verify the setup
SELECT 'Animal Profiles Schema Setup Complete!' as status;

