-- Animal Profiles Schema for Organizations
-- This table stores animal ambassador profiles that organizations can create and manage

-- Create animal_profiles table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_animal_profiles_organization_id ON animal_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_status ON animal_profiles(status);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_featured ON animal_profiles(featured);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_created_at ON animal_profiles(created_at);

-- Create animal_profiles_media table for multiple images/videos
CREATE TABLE IF NOT EXISTS animal_profiles_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES animal_profiles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for media
CREATE INDEX IF NOT EXISTS idx_animal_profiles_media_animal_id ON animal_profiles_media(animal_id);

-- Create animal_profiles_updates table for progress updates
CREATE TABLE IF NOT EXISTS animal_profiles_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES animal_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for updates
CREATE INDEX IF NOT EXISTS idx_animal_profiles_updates_animal_id ON animal_profiles_updates(animal_id);

-- Create animal_profiles_donations table to track donations
CREATE TABLE IF NOT EXISTS animal_profiles_donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES animal_profiles(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    message TEXT,
    anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for donations
CREATE INDEX IF NOT EXISTS idx_animal_profiles_donations_animal_id ON animal_profiles_donations(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_donations_donor_id ON animal_profiles_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_donations_created_at ON animal_profiles_donations(created_at);

-- Create animal_profiles_followers table for people following specific animals
CREATE TABLE IF NOT EXISTS animal_profiles_followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES animal_profiles(id) ON DELETE CASCADE,
    follower_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(animal_id, follower_id)
);

-- Create index for followers
CREATE INDEX IF NOT EXISTS idx_animal_profiles_followers_animal_id ON animal_profiles_followers(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_followers_follower_id ON animal_profiles_followers(follower_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_animal_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
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

-- Create function to calculate total raised for an animal
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

-- Create function to get animal statistics
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

-- Insert some sample data for testing (optional)
-- INSERT INTO animal_profiles (organization_id, name, species, breed, age, bio, goal, status) 
-- VALUES 
--     ('your-org-user-id-here', 'Luna', 'Cat', 'Domestic Shorthair', '3 years', 'Luna is a sweet cat looking for her forever home', 500, 'active'),
--     ('your-org-user-id-here', 'Max', 'Dog', 'Golden Retriever', '2 years', 'Max is a friendly dog who loves to play', 800, 'active');

-- Grant necessary permissions (adjust based on your Supabase setup)
-- GRANT ALL ON animal_profiles TO authenticated;
-- GRANT ALL ON animal_profiles_media TO authenticated;
-- GRANT ALL ON animal_profiles_updates TO authenticated;
-- GRANT ALL ON animal_profiles_donations TO authenticated;
-- GRANT ALL ON animal_profiles_followers TO authenticated;

-- Enable Row Level Security (RLS)
ALTER TABLE animal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_profiles_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_profiles_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_profiles_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_profiles_followers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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
CREATE POLICY "Organizations can manage their animal media" ON animal_profiles_media
    FOR ALL USING (
        animal_id IN (
            SELECT id FROM animal_profiles WHERE organization_id = auth.uid()
        )
    );

-- Anyone can view published animal media
CREATE POLICY "Anyone can view published animal media" ON animal_profiles_media
    FOR SELECT USING (
        animal_id IN (
            SELECT id FROM animal_profiles WHERE status != 'draft'
        )
    );

-- Organizations can manage their animal updates
CREATE POLICY "Organizations can manage their animal updates" ON animal_profiles_updates
    FOR ALL USING (
        animal_id IN (
            SELECT id FROM animal_profiles WHERE organization_id = auth.uid()
        )
    );

-- Anyone can view published animal updates
CREATE POLICY "Anyone can view published animal updates" ON animal_profiles_updates
    FOR SELECT USING (
        animal_id IN (
            SELECT id FROM animal_profiles WHERE status != 'draft'
        )
    );

-- Users can make donations to any published animal
CREATE POLICY "Users can donate to published animals" ON animal_profiles_donations
    FOR INSERT WITH CHECK (
        animal_id IN (
            SELECT id FROM animal_profiles WHERE status != 'draft'
        )
    );

-- Users can view their own donations
CREATE POLICY "Users can view their own donations" ON animal_profiles_donations
    FOR SELECT USING (donor_id = auth.uid());

-- Organizations can view donations to their animals
CREATE POLICY "Organizations can view donations to their animals" ON animal_profiles_donations
    FOR SELECT USING (
        animal_id IN (
            SELECT id FROM animal_profiles WHERE organization_id = auth.uid()
        )
    );

-- Users can follow/unfollow published animals
CREATE POLICY "Users can follow published animals" ON animal_profiles_followers
    FOR ALL USING (
        animal_id IN (
            SELECT id FROM animal_profiles WHERE status != 'draft'
        )
    );

-- Users can manage their own follows
CREATE POLICY "Users can manage their own follows" ON animal_profiles_followers
    FOR ALL USING (follower_id = auth.uid());

-- Organizations can view followers of their animals
CREATE POLICY "Organizations can view followers of their animals" ON animal_profiles_followers
    FOR SELECT USING (
        animal_id IN (
            SELECT id FROM animal_profiles WHERE organization_id = auth.uid()
        )
    );
