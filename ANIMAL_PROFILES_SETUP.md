# Animal Profiles Setup Guide

This guide explains how to set up the animal profiles system that allows organizations to create and manage animal ambassador profiles for fundraising.

## Overview

The animal profiles system enables organizations to:
- Create detailed profiles for animals in need
- Track fundraising progress and goals
- Share updates and progress with supporters
- Accept donations from the community
- Manage multiple animals with different statuses

## Database Setup

### 1. Run the SQL Script

Execute the `animal-profiles-schema.sql` script in your Supabase SQL Editor:

```sql
-- This will create:
-- - animal_profiles table (main animal data)
-- - animal_profiles_media table (images/videos)
-- - animal_profiles_updates table (progress updates)
-- - animal_profiles_donations table (donation tracking)
-- - animal_profiles_followers table (followers)
-- - All necessary indexes and functions
-- - Row Level Security (RLS) policies
```

### 2. Verify the Tables

After running the script, verify that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'animal_profiles%';
```

### 3. Check RLS Policies

Verify that Row Level Security is enabled and policies are in place:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename LIKE 'animal_profiles%';
```

## How It Works

### Organization Access

- **Only organizations** can create animal profiles
- **Individual users** can view, donate to, and follow animals
- **Organizations** can manage all aspects of their animals

### Animal Profile Structure

Each animal profile includes:
- **Basic Info**: Name, species, breed, age
- **Story**: Bio and detailed story
- **Fundraising**: Goal amount and current progress
- **Status**: Active, completed, paused, or draft
- **Media**: Multiple images and videos
- **Updates**: Progress updates and milestones

### Security Features

- **Row Level Security (RLS)** ensures data privacy
- **Organization isolation** - organizations can only see their own animals
- **Public viewing** - anyone can view published animal profiles
- **Donation tracking** - secure donation processing

## Frontend Integration

### Dashboard Access

The organization dashboard (`/dashboard`) is accessible via:
- **Profile page**: "View Dashboard" button (only for organization accounts)
- **Direct URL**: `/dashboard` (requires organization login)

### Key Features

1. **Analytics Overview**
   - Total animals and active fundraisers
   - Total raised and donor count
   - Monthly growth and average donation

2. **Animal Management**
   - Add new animal profiles
   - Edit existing profiles
   - View fundraising progress
   - Manage status and updates

3. **Search and Filtering**
   - Search by name or species
   - Filter by status (active, completed, paused)
   - Sort by various criteria

## Testing the System

### 1. Create an Organization Account

1. Sign up with user type "Organization"
2. Complete the profile setup
3. Verify the "View Dashboard" button appears

### 2. Access the Dashboard

1. Click "View Dashboard" from your profile
2. Verify analytics cards display (initially with mock data)
3. Check that the "Add New Animal" button is visible

### 3. Create an Animal Profile

1. Click "Add New Animal"
2. Fill in the form with test data
3. Submit and verify the animal appears in the grid

### 4. Test Animal Management

1. Edit an existing animal profile
2. Change the status (active, paused, completed)
3. Delete an animal profile
4. Verify search and filtering work

## Next Steps

After setting up the basic system, you can:

1. **Implement Real Data Integration**
   - Replace mock data with actual database queries
   - Add image upload functionality
   - Implement donation processing

2. **Add Advanced Features**
   - Progress update system
   - Donor recognition
   - Social sharing
   - Email notifications

3. **Create Public Animal Pages**
   - Individual animal profile pages
   - Donation forms
   - Progress tracking displays

4. **Analytics and Reporting**
   - Real-time fundraising metrics
   - Donor analytics
   - Performance tracking

## Troubleshooting

### Common Issues

1. **Dashboard not accessible**
   - Verify user type is 'organization'
   - Check that the route is properly configured
   - Ensure user is logged in

2. **Animals not loading**
   - Check database connection
   - Verify RLS policies are active
   - Check console for error messages

3. **Permission errors**
   - Ensure RLS policies are correctly configured
   - Verify user authentication
   - Check organization_id matches

### Debug Queries

```sql
-- Check if animal profiles exist
SELECT * FROM animal_profiles LIMIT 5;

-- Verify organization user types
SELECT user_id, full_name, user_type 
FROM user_profiles 
WHERE user_type = 'organization';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'animal_profiles';
```

## Security Notes

- All tables have Row Level Security enabled
- Organizations can only access their own animal data
- Public users can only view published (non-draft) profiles
- Donation data is protected and private
- Media uploads should be validated and sanitized

## Performance Considerations

- Indexes are created on frequently queried columns
- Functions are optimized for common operations
- Consider pagination for large animal lists
- Implement caching for frequently accessed data

---

The animal profiles system provides a robust foundation for organizations to manage their fundraising campaigns while maintaining security and performance. 🐾
