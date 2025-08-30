# Community System Setup Guide

## Overview
The Zoomies application now includes a persistent community system that stores data in Supabase and links users to communities they've joined.

## Database Setup

### 1. Run the SQL Schema
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `COMMUNITY_SCHEMA.sql`
4. Run the script to create all necessary tables and functions

### 2. What Gets Created
- **`communities`** table - Stores community information
- **`community_members`** table - Tracks user memberships and activity
- **`community_posts`** table - Stores posts within communities
- **`get_community_stats()`** function - Returns member counts and active users
- **RLS policies** - Ensures data security
- **Indexes** - Optimizes query performance

## Features

### Persistent Data
- ✅ Community memberships persist across sessions
- ✅ Member counts grow over time as users join
- ✅ Active user tracking based on real activity
- ✅ Posts are stored in the database

### User Experience
- ✅ "My Groups" section shows joined communities
- ✅ Real-time member and active user counts
- ✅ Community-specific post creation
- ✅ Activity tracking when users interact

### Security
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only manage their own memberships
- ✅ Posts are linked to authenticated users

## How It Works

### 1. Community Loading
- On page load, fetches communities from database
- Gets real-time member counts and active users
- Loads user's joined communities

### 2. Joining/Leaving
- Updates database when user joins/leaves
- Refreshes community statistics
- Updates local state for immediate UI feedback

### 3. Post Creation
- Posts are saved to database
- Linked to specific communities
- Updates user activity timestamps

### 4. Activity Tracking
- User activity is tracked when viewing communities
- Active counts reflect real user interactions
- Activity timestamps are automatically updated

## API Endpoints Used

The system uses these Supabase operations:
- `communities.select()` - Get all communities
- `community_members.upsert()` - Join communities
- `community_members.delete()` - Leave communities
- `community_posts.insert()` - Create posts
- `rpc('get_community_stats')` - Get member counts

## Troubleshooting

### Common Issues
1. **"Function get_community_stats does not exist"**
   - Make sure you ran the complete SQL schema
   - Check that the function was created successfully

2. **"Permission denied"**
   - Verify RLS policies are enabled
   - Check that user is authenticated

3. **Counts not updating**
   - Ensure the database triggers are working
   - Check that the `update_member_activity` function exists

### Testing
1. Create a test user account
2. Join a community
3. Refresh the page - membership should persist
4. Check that member count increased
5. Create a post - should appear in database

## Future Enhancements

Potential additions:
- Community moderation tools
- Post reactions and comments
- Community categories and tags
- User reputation systems
- Community analytics dashboard

