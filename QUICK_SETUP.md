# Quick Setup Guide

## The Problem
Your diagnostic shows that the required database tables are missing. This is why you're getting the foreign key constraint error.

## The Solution
You need to run the database setup script in Supabase.

## Step-by-Step Setup

### 1. Go to Supabase Dashboard
- Open your Supabase project dashboard
- Click on **"SQL Editor"** in the left sidebar

### 2. Run the Setup Script
- Copy the entire contents of **`complete-setup-script.sql`**
- Paste it into the SQL Editor
- Click **"Run"** button

### 3. Verify Setup
- You should see: `Setup complete! All tables and policies created successfully.`
- If you see any errors, they will be shown in red

### 4. Test the Dashboard
- Go back to your dashboard page
- Try creating an animal profile again
- It should now work without the foreign key error

## What the Setup Script Creates

✅ **user_profiles** table - stores user information  
✅ **animal_profiles** table - stores animal ambassador data  
✅ **animal_profiles_media** table - stores images/videos  
✅ **animal_profiles_updates** table - stores progress updates  
✅ **animal_profiles_donations** table - stores donation data  
✅ **animal_profiles_followers** table - stores follower data  
✅ **All necessary indexes** for performance  
✅ **Row Level Security policies** for data protection  

## If You Still Get Errors

1. **Check the SQL Editor output** for any error messages
2. **Make sure you're logged in** to your Supabase account
3. **Verify you have the right permissions** in your Supabase project
4. **Check the browser console** for any JavaScript errors

## Need Help?

The setup script is designed to be safe and can be run multiple times. If you encounter any specific error messages, please share them so I can help further.

---

**Run the setup script and your animal profiles should work!** 🐾

