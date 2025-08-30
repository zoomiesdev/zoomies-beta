# Animal Profiles Setup Guide (Fixed Version)

This guide addresses the policy conflict issue you encountered and provides a safe way to set up the animal profiles system.

## The Problem

You encountered this error:
```
ERROR: 42710: policy "Organizations can manage their animal media" for table "animal_profiles_media" already exists
```

This happens when some policies already exist in your database from a previous setup attempt.

## Solution: Clean Setup

### Step 1: Clean Up Existing Policies (Optional)

If you want to start fresh, run this cleanup script first in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of cleanup-duplicate-policies.sql
```

### Step 2: Run the Fixed Schema

Use the new safe schema file:

```sql
-- Copy and paste the contents of animal-profiles-schema-fixed.sql
```

This script:
- ✅ Uses `CREATE TABLE IF NOT EXISTS` for all tables
- ✅ Uses `CREATE INDEX IF NOT EXISTS` for all indexes  
- ✅ Wraps ALL policies in `DO $$ BEGIN IF NOT EXISTS ... END $$;` blocks
- ✅ Can be run multiple times without errors
- ✅ Safely handles existing tables and policies

### Step 3: Verify Setup

After running the script, you should see:
```
Setup complete! All tables and policies created successfully.
```

## Alternative: Quick Fix

If you just want to get it working quickly:

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run the cleanup script** (`cleanup-duplicate-policies.sql`)
3. **Run the fixed schema** (`animal-profiles-schema-fixed.sql`)
4. **Refresh your dashboard** page

## What This Fixes

- ❌ **Policy conflicts** from duplicate policy creation
- ❌ **Table creation errors** from existing tables
- ❌ **Index conflicts** from existing indexes
- ❌ **Trigger conflicts** from existing triggers

## Testing

After setup, try creating an animal profile again. The dashboard should now work without the "Failed to create animal profile" error.

## Need Help?

If you still encounter issues:
1. Check the browser console for specific error messages
2. Verify all tables exist: `SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'animal_profiles%';`
3. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename LIKE 'animal_profiles%';`

---

The fixed schema ensures a smooth setup process! 🐾

