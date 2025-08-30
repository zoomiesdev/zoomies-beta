-- Community and Membership Database Schema
-- Run this in your Supabase SQL editor

-- 1. Create users table for storing user profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create communities table
CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create community_members table to track user memberships
CREATE TABLE IF NOT EXISTS community_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id TEXT REFERENCES communities(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

-- 3. Create community_posts table for posts within communities
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id TEXT REFERENCES communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  topic TEXT,
  images JSONB DEFAULT '[]',
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create post_votes table for tracking user votes
CREATE TABLE IF NOT EXISTS post_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 0, 1)), -- -1: downvote, 0: no vote, 1: upvote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 5. Create post_comments table for comments on posts
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- For nested comments
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create comment_votes table for tracking comment votes
CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 0, 1)), -- -1: downvote, 0: no vote, 1: upvote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- 4. Insert initial communities
INSERT INTO communities (id, name, description, icon_name) VALUES
  -- Core Animal Care
  ('care', 'General Animal Care', 'Daily care & welfare', 'PawPrint'),
  ('health', 'Pet Health', 'Veterinary care, nutrition, and wellness', 'PawPrint'),
  ('grooming', 'Pet Grooming', 'Keeping our pets clean and beautiful', 'PawPrint'),
  ('training', 'Animal Training', 'Behavior, obedience, and skill development', 'PawPrint'),
  ('tips', 'Care Tips', 'Practical advice for pet parents', 'PawPrint'),
  
  -- Pet Photography & Media
  ('photos', 'Pet Photography', 'Share & discuss pet photos', 'Camera'),
  ('videos', 'Pet Videos', 'Moving pictures of our furry friends', 'Camera'),
  ('art', 'Pet Art', 'Creative expressions featuring animals', 'Camera'),
  
  -- Animal Types
  ('dogs', 'Dog Lovers', 'Everything about our canine friends', 'Dog'),
  ('cats', 'Cat Enthusiasts', 'Feline friends and their antics', 'Cat'),
  ('birds', 'Bird Keepers', 'Feathered friends and avian care', 'Bird'),
  ('reptiles', 'Reptile Care', 'Scales, tails, and cold-blooded companions', 'Turtle'),
  ('fish', 'Aquatic Life', 'Underwater friends and aquarium care', 'Fish'),
  ('farm', 'Farm Animals', 'Barnyard buddies and livestock care', 'PawPrint'),
  ('exotic', 'Exotic Pets', 'Unique and unusual animal companions', 'Panda'),
  
  -- Life Stages
  ('puppies', 'Puppy Care', 'Raising and training young dogs', 'Dog'),
  ('kittens', 'Kitten Care', 'Raising and socializing young cats', 'Cat'),
  ('senior', 'Senior Pets', 'Caring for our aging animal friends', 'PawPrint'),
  
  -- Rescue & Adoption
  ('adoption', 'Adoption Support', 'Help adopting/fostering', 'HeartHandshake'),
  ('rescue', 'Rescue Stories', 'Share rescue experiences', 'Heart'),
  ('foster', 'Foster Care', 'Temporary homes for animals in need', 'Heart'),
  ('success', 'Success Stories', 'Happy endings and transformation tales', 'Heart'),
  
  -- Wildlife & Conservation
  ('wildlife', 'Wildlife Conservation', 'Wild animal protection', 'Squirrel'),
  
  -- Activities & Lifestyle
  ('travel', 'Pet Travel', 'Adventures with our animal companions', 'PawPrint'),
  ('events', 'Pet Events', 'Shows, meetups, and animal gatherings', 'Users'),
  
  -- Community & Support
  ('volunteer', 'Animal Volunteering', 'Giving back to animal causes', 'Users'),
  ('donations', 'Animal Charities', 'Supporting animal welfare organizations', 'Heart'),
  ('questions', 'Q&A', 'Ask and answer animal care questions', 'MessageCircle'),
  
  -- Fun & Entertainment
  ('funny', 'Pet Humor', 'Funny moments and silly pet stories', 'PawPrint'),
  ('names', 'Pet Names', 'Naming inspiration and suggestions', 'PawPrint'),
  ('breeds', 'Breed Information', 'Learn about different animal breeds', 'PawPrint'),
  
  -- Memorial & Remembrance
  ('memorial', 'Pet Memorials', 'Remembering our beloved companions', 'Heart')
ON CONFLICT (id) DO NOTHING;

-- 5. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for communities
DROP POLICY IF EXISTS "Communities are viewable by everyone" ON communities;
CREATE POLICY "Communities are viewable by everyone" ON communities
  FOR SELECT USING (true);

-- 7. Create RLS policies for community_members
DROP POLICY IF EXISTS "Users can view all community memberships" ON community_members;
CREATE POLICY "Users can view all community memberships" ON community_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own memberships" ON community_members;
CREATE POLICY "Users can insert their own memberships" ON community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own memberships" ON community_members;
CREATE POLICY "Users can update their own memberships" ON community_members
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own memberships" ON community_members;
CREATE POLICY "Users can delete their own memberships" ON community_members
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Create RLS policies for community_posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON community_posts;
CREATE POLICY "Posts are viewable by everyone" ON community_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own posts" ON community_posts;
CREATE POLICY "Users can insert their own posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON community_posts;
CREATE POLICY "Users can update their own posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON community_posts;
CREATE POLICY "Users can delete their own posts" ON community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Create RLS policies for post_votes
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON post_votes;
CREATE POLICY "Votes are viewable by everyone" ON post_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own votes" ON post_votes;
CREATE POLICY "Users can manage their own votes" ON post_votes
  FOR ALL USING (auth.uid() = user_id);

-- 10. Create RLS policies for post_comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON post_comments;
CREATE POLICY "Comments are viewable by everyone" ON post_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own comments" ON post_comments;
CREATE POLICY "Users can insert their own comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON post_comments;
CREATE POLICY "Users can update their own comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;
CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 11. Create RLS policies for comment_votes
DROP POLICY IF EXISTS "Comment votes are viewable by everyone" ON comment_votes;
CREATE POLICY "Comment votes are viewable by everyone" ON comment_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own comment votes" ON comment_votes;
CREATE POLICY "Users can manage their own comment votes" ON comment_votes
  FOR ALL USING (auth.uid() = id);

-- 12. Create RLS policies for users
DROP POLICY IF EXISTS "User profiles are viewable by everyone" ON users;
CREATE POLICY "User profiles are viewable by everyone" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON users;
CREATE POLICY "Users can delete their own profile" ON users
  FOR DELETE USING (auth.uid() = id);

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_user_id ON post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_community_members_active ON community_members(is_active, last_activity);

-- 10. Create function to update last_activity
CREATE OR REPLACE FUNCTION update_member_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger to automatically update last_activity
DROP TRIGGER IF EXISTS trigger_update_member_activity ON community_members;
CREATE TRIGGER trigger_update_member_activity
  BEFORE UPDATE ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION update_member_activity();

-- 12. Create function to get community statistics
DROP FUNCTION IF EXISTS get_community_stats();
CREATE OR REPLACE FUNCTION get_community_stats()
RETURNS TABLE (
  community_id TEXT,
  total_members BIGINT,
  active_members BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    COUNT(cm.id)::BIGINT as total_members,
    COUNT(CASE WHEN cm.is_active AND cm.last_activity > NOW() - INTERVAL '1 hour' THEN 1 END)::BIGINT as active_members
  FROM communities c
  LEFT JOIN community_members cm ON c.id = cm.community_id
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;

-- 13. Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create trigger to call the function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
