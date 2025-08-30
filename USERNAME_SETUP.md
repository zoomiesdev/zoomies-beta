# Username Setup Guide

## Problem
Currently, users don't have unique usernames in the `user_profiles` table, which prevents:
- User tagging in best friends widget
- Proper user identification
- Unique user references

## Solution
Add username field with unique constraint to `user_profiles` table.

## Step 1: Run Database Migration

Execute this SQL in your Supabase SQL Editor:

```sql
-- Add username field to user_profiles table with unique constraint
-- This ensures each user has a unique username for tagging and identification

-- First, add the username column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'username'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN username VARCHAR(50);
    END IF;
END $$;

-- Add unique constraint on username (case-insensitive)
-- This prevents duplicate usernames
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_username_unique'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_username_unique 
        UNIQUE (LOWER(username));
    END IF;
END $$;

-- Add index on username for faster searches
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_user_profiles_username'
    ) THEN
        CREATE INDEX idx_user_profiles_username ON user_profiles (LOWER(username));
    END IF;
END $$;

-- Update existing profiles to have usernames if they don't have them
-- Use the user_id as a fallback username
UPDATE user_profiles 
SET username = 'user_' || SUBSTRING(user_id::text, 1, 8)
WHERE username IS NULL OR username = '';

-- Make username NOT NULL after setting default values
ALTER TABLE user_profiles ALTER COLUMN username SET NOT NULL;
```

## Step 2: Update UserProfilePage.jsx

Import the username functions:

```javascript
import { generateUniqueUsername, validateUsername, isUsernameAvailable } from './username-functions.js';
```

## Step 3: Update Profile Saving Logic

Modify the `saveProfileData` function to include username generation:

```javascript
// In saveProfileData function, add username to both updateData and insertData:

// For existing profiles (update):
const updateData = {
  username: profileData.username, // Add this line
  full_name: profileData.full_name || profileData.fullName,
  // ... rest of fields
};

// For new profiles (insert):
const insertData = {
  user_id: user.id,
  username: await generateUniqueUsername(supabase, profileData.full_name, user.id), // Add this line
  full_name: profileData.full_name || profileData.fullName,
  // ... rest of fields
};
```

## Step 4: Update User Search

The search function should now work properly since usernames are stored in the database:

```javascript
const searchUsers = async (query) => {
  // ... existing code ...
  
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, username, avatar_url')
    .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
    .limit(10);
    
  // ... rest of function ...
};
```

## Step 5: Test

1. Run the SQL migration
2. Refresh your profile page
3. Try the "Tag User" feature in the best friends widget
4. Search for "testuser2" - it should now appear if it has a profile

## Expected Result

- All users will have unique usernames
- User search will work properly
- Best friends widget can tag real users
- Profile pictures will be pulled automatically
- No duplicate usernames allowed

## Troubleshooting

If users still don't appear:
1. Check if they have a profile record in `user_profiles` table
2. Verify the username field was added successfully
3. Check console logs for search debugging info
4. Ensure RLS policies allow reading user_profiles
