# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy your Project URL and anon public key
3. Create a `.env` file in your project root with:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Configure Authentication

1. In Supabase dashboard, go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:5173` for development)
3. Add any additional redirect URLs you need
4. Under "Email Templates", customize your confirmation email if desired

## 4. Database Schema (Optional)

If you want to store additional user data, you can create a `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 5. Test the Setup

1. Start your development server: `npm run dev`
2. Try to sign up with a new email
3. Check your email for the confirmation link
4. Sign in with your credentials

## 6. Environment Variables

Make sure your `.env` file is in the project root and contains:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Never commit your `.env` file to version control. Add it to `.gitignore`.

## 7. Troubleshooting

- **"Invalid API key"**: Check your anon key in the `.env` file
- **"Invalid URL"**: Ensure your Supabase URL is correct
- **Email not sending**: Check your Supabase project's email settings
- **CORS errors**: Verify your site URL is configured in Supabase Auth settings 