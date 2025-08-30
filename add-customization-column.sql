-- Add customization column to user_profiles table
-- Run this in your Supabase SQL editor

-- Add the customization column as JSONB to store all customization settings
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS customization JSONB DEFAULT '{
  "theme": "default",
  "backgroundType": "color",
  "backgroundColor": "#ffffff",
  "backgroundPhoto": "",
  "accentColor": "#3b82f6",
  "headerTextColor": "#1f2937",
  "bodyTextColor": "#374151",
  "sidebarWidgets": ["about", "activity-stats", "recent-activity"]
}'::jsonb;

-- Add an index on the customization column for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_customization ON user_profiles USING GIN(customization);

-- Update existing profiles to have the default customization if they don't have it
UPDATE user_profiles 
SET customization = '{
  "theme": "default",
  "backgroundType": "color",
  "backgroundColor": "#ffffff",
  "backgroundPhoto": "",
  "accentColor": "#3b82f6",
  "headerTextColor": "#1f2937",
  "bodyTextColor": "#374151",
  "sidebarWidgets": ["about", "activity-stats", "recent-activity"]
}'::jsonb
WHERE customization IS NULL; 