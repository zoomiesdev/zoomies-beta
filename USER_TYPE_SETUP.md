# User Type Setup Guide

This guide explains how to set up the new user type functionality that distinguishes between individual users and organizations.

## Overview

The system now supports two types of users:
- **Individual Users**: Regular users who can browse, donate, and participate in the community
- **Organizations**: Sanctuaries, rescues, and other organizations that can create animal ambassador profiles

## Database Setup

### 1. Run the SQL Script

Execute the `add-user-type-column.sql` script in your Supabase SQL Editor:

```sql
-- This will:
-- - Add user_type column to user_profiles table
-- - Set default value to 'individual'
-- - Add constraint to ensure valid values
-- - Create index for performance
-- - Update existing profiles
```

### 2. Verify the Changes

After running the script, verify that the column was added:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'user_type';
```

## How It Works

### Signup Flow

1. **User selects type**: Individual or Organization
2. **Name field adapts**: 
   - Individual → "Full name"
   - Organization → "Organization name"
3. **Profile creation**: User type is stored in database
4. **Access control**: Organizations get access to animal profile creation

### User Type Storage

- **Database**: `user_profiles.user_type` field
- **Auth metadata**: `user_metadata.user_type` field
- **Default**: All existing users become 'individual' type

### Access Control

- **Individual users**: Can browse, donate, participate in community
- **Organizations**: Can do everything individuals can, PLUS create animal ambassador profiles

## Implementation Details

### Frontend Changes

- **AuthModal**: Added user type selection buttons
- **Dynamic fields**: Name field changes based on user type
- **Form validation**: Ensures appropriate fields are filled

### Backend Changes

- **AuthContext**: Stores user type during signup
- **Database**: New user_type column with constraints
- **Profile creation**: Includes user type in new profiles

## Testing

### Test Individual Signup

1. Select "Individual" user type
2. Fill in personal name
3. Complete signup
4. Verify profile shows as individual user

### Test Organization Signup

1. Select "Organization" user type
2. Fill in organization name
3. Complete signup
4. Verify profile shows as organization

### Test Existing Users

1. Existing users should default to 'individual' type
2. Verify no data loss occurred
3. Check that profiles still work normally

## Next Steps

After implementing user types, you can:

1. **Add animal profile creation** for organizations only
2. **Implement role-based UI** showing different options
3. **Add organization-specific features** like sanctuary management
4. **Create organization profiles** with different layouts

## Troubleshooting

### Common Issues

1. **Column already exists**: Script handles this gracefully
2. **Constraint violation**: Ensure user_type is 'individual' or 'organization'
3. **Existing profiles**: All existing profiles will be set to 'individual'

### Rollback

If you need to rollback:

```sql
-- Remove the column (WARNING: This will lose user type data)
ALTER TABLE user_profiles DROP COLUMN user_type;

-- Remove the constraint
ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_user_type_check;

-- Remove the index
DROP INDEX IF EXISTS idx_user_profiles_user_type;
```

## Security Notes

- User type is set during signup and cannot be changed by users
- Only organizations can create animal profiles
- Individual users cannot access organization-only features
- User type is stored in both auth metadata and profile table for redundancy

