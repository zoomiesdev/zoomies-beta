// Username generation and validation functions for user profiles

// Generate a unique username based on full name or user ID
export const generateUniqueUsername = async (supabase, fullName, userId) => {
  if (!fullName && !userId) return null;
  
  // Try to create username from full name
  let baseUsername = '';
  if (fullName) {
    baseUsername = fullName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove special characters
      .substring(0, 20); // Limit length
  } else {
    baseUsername = `user_${userId.substring(0, 8)}`;
  }
  
  // Check if username exists and add number if needed
  let username = baseUsername;
  let counter = 1;
  
  while (counter < 100) { // Prevent infinite loop
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Username doesn't exist, we can use it
        return username;
      }
      
      // Username exists, try with number
      username = `${baseUsername}${counter}`;
      counter++;
    } catch (err) {
      console.error('Error checking username uniqueness:', err);
      return username; // Return current username on error
    }
  }
  
  // Fallback to timestamp-based username
  return `${baseUsername}_${Date.now()}`;
};

// Validate username format
export const validateUsername = (username) => {
  if (!username) return { valid: false, error: 'Username is required' };
  if (username.length < 3) return { valid: false, error: 'Username must be at least 3 characters' };
  if (username.length > 30) return { valid: false, error: 'Username must be less than 30 characters' };
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
};

// Check if username is available
export const isUsernameAvailable = async (supabase, username) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username)
      .single();
    
    if (error && error.code === 'PGRST116') {
      return true; // Username is available
    }
    
    return false; // Username is taken
  } catch (err) {
    console.error('Error checking username availability:', err);
    return false; // Assume unavailable on error
  }
};
