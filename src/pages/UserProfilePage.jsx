import { useState, useEffect } from "react";
import { useAuth } from "../contexts/useAuth";
import { useTheme } from "../theme/useTheme";
import { supabase } from "../lib/supabase";
import { Card, Button, Input, Textarea, Chip } from "../components/ui";
import { 
  MapPin, 
  Users, 
  Share2, 
  Upload, 
  X, 
  PawPrint,
  Camera,
  MessageCircle,
  Plus,
  ChevronUp,
  ChevronDown,
  ArrowRight
} from "lucide-react";

const TOPICS = [
  "Animal Care", "Pet Pics", "Rescue Stories", "Wildlife", "Adoption", 
  "Volunteering", "Donations", "Education", "Events", "Tips & Advice"
];

export default function UserProfilePage() {
  console.log('=== USER PROFILE PAGE LOADED ===');
  console.log('Component is rendering...');
  
  const { user } = useAuth();
  const { theme: userTheme } = useTheme();
  
  console.log('User from auth:', user);
  console.log('User theme:', userTheme);
  
  // ALL hooks must be called before any conditional returns
  const [profileData, setProfileData] = useState({
    username: "",
    full_name: "",
    fullName: "", // Keep for backward compatibility
    bio: "",
    location: "",
    website: "",
    instagram: "",
    avatar: "",
    banner: "",
    tags: [],
    followers: 0,
    animalsHelped: 0,
    sanctuariesSupported: 0,
    daysActive: 0
  });
  const [tab, setTab] = useState("Timeline");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postData, setPostData] = useState({
    title: "",
    content: "",
    images: [],
    community: "",
    topic: ""
  });
  const [customization, setCustomization] = useState({
    theme: "default",
    backgroundType: "color",
    backgroundColor: "#ffffff",
    backgroundPhoto: "",
    accentColor: "#3b82f6",
    headerTextColor: "#1f2937",
    bodyTextColor: "#374151",
    sidebarWidgets: ["about", "activity-stats", "recent-activity", "music-player", "best-friends"]
  });
  
  // Widget-specific data
  const [bestFriends, setBestFriends] = useState([]);
  
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  
  const [musicPlayer, setMusicPlayer] = useState({
    songTitle: "",
    artist: "",
    albumArt: "",
    isPlaying: false,
    progress: 0
  });
  const [isResettingTheme, setIsResettingTheme] = useState(false);
  const [customizationLoaded, setCustomizationLoaded] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postVotes, setPostVotes] = useState(new Map());
  const [comments, setComments] = useState(new Map());
  const [commentsLoading, setCommentsLoading] = useState(new Map());
  const [newComment, setNewComment] = useState(new Map());
  const [showComments, setShowComments] = useState(new Set());
  
  // ALL hooks must be called before any conditional returns
  useEffect(() => {
  const loadProfileData = async () => {
    try {
        console.log('=== LOAD PROFILE DATA START ===');
        console.log('Loading profile data for user:', user?.id);
        
        if (!user) {
          console.log('No user, skipping profile load');
          return;
        }
        
        // First test if we can connect to the database
        console.log('Testing database connection...');
        const { data: testData, error: testError } = await supabase
          .from('user_profiles')
          .select('count')
          .limit(1);
        
        if (testError) {
          console.error('Database connection test failed:', testError);
          alert(`Database connection failed: ${testError.message}`);
          return;
        }
        console.log('Database connection successful');
        
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

        console.log('Profile query result:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
          console.log('Profile data loaded:', data);
          console.log('Profile ID:', data.id);
          console.log('User ID:', data.user_id);
          console.log('Avatar URL from database:', data.avatar_url);
          console.log('Banner URL from database:', data.banner_url);
          
        console.log('Setting profile data with username:', {
          databaseUsername: data.username,
          authMetadataUsername: user?.user_metadata?.username,
          finalUsername: data.username || user?.user_metadata?.username || ""
        });
        
        setProfileData(prev => ({
          ...prev,
          ...data,
            // Map database fields to local state fields
            avatar: data.avatar_url || prev.avatar,
            banner: data.banner_url || prev.banner,
            tags: data.tags || [],
            // Ensure username is loaded from database or fallback to auth metadata
            username: data.username || user?.user_metadata?.username || ""
        }));
        
        if (data.customization) {
            console.log('Customization data loaded:', data.customization);
          setCustomization(prev => ({
            ...prev,
            ...data.customization
          }));
            
            // Load widget data if it exists
            if (data.customization.bestFriends) {
              console.log('Loading bestFriends from database:', data.customization.bestFriends);
              setBestFriends(data.customization.bestFriends);
            }

            if (data.customization.musicPlayer) {
              console.log('Loading musicPlayer from database:', data.customization.musicPlayer);
              setMusicPlayer(data.customization.musicPlayer);
            }
            
            setCustomizationLoaded(true);
          } else {
            console.log('No customization data found, using defaults');
            setCustomizationLoaded(true);
          }
        } else {
          console.log('No profile data found, user may need to create profile');
        }
        
        // Load user's posts
        await loadUserPosts();
        
        console.log('=== LOAD PROFILE DATA END ===');
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

    loadProfileData();
  }, [user]);

  // Update customization when user theme changes
  useEffect(() => {
    // Only run this effect if:
    // 1. User is authenticated
    // 2. Customization has been loaded from database (not initial state)
    // 3. Theme is 'default' (not a specific theme like 'dark', 'nature', etc.)
    // 4. Not currently resetting
    if (!user || !customizationLoaded || customization.theme !== 'default' || isResettingTheme) {
      return;
    }
    
    // Check if the current colors are the default ones (indicating no manual customization)
    const isUsingDefaultColors = 
      (customization.backgroundColor === "#000000" || customization.backgroundColor === "#ffffff") &&
      (customization.headerTextColor === "#ffffff" || customization.headerTextColor === "#000000") &&
      (customization.bodyTextColor === "#ffffff" || customization.bodyTextColor === "#000000");
    
    if (isUsingDefaultColors) {
      console.log('Applying default theme colors for system preference:', userTheme);
      const themes = {
        default: {
          backgroundColor: userTheme === 'dark' ? "#000000" : "#ffffff",
          accentColor: "#3b82f6",
          headerTextColor: userTheme === 'dark' ? "#ffffff" : "#000000",
          bodyTextColor: userTheme === 'dark' ? "#ffffff" : "#000000"
        }
      };
      
      setCustomization(prev => ({
        ...prev,
        theme: 'default',
        ...themes.default
      }));
    }
  }, [user, userTheme, customization.theme, isResettingTheme, customizationLoaded]);
  
  // Simulate music progress bar
  useEffect(() => {
    let interval;
    if (musicPlayer.isPlaying) {
      interval = setInterval(() => {
        setMusicPlayer(prev => ({
          ...prev,
          progress: prev.progress >= 100 ? 0 : prev.progress + 1
        }));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [musicPlayer.isPlaying]);
  
  // Debug logging after all hooks
  console.log('Customization theme:', customization.theme);
  
  // Load user's posts
  const loadUserPosts = async () => {
    if (!user) return;
    
    setPostsLoading(true);
    try {
      const { data: userPosts, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          community:communities(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && userPosts) {
        setPosts(userPosts);
      }
    } catch (err) {
      console.error('Error loading user posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  // Post voting functionality
  const handlePostVote = async (postId, voteType) => {
    if (!user) return;
    
    try {
      const currentVote = postVotes.get(postId);
      let newVoteType = voteType;
      
      // If clicking the same vote type, remove the vote
      if (currentVote === voteType) {
        newVoteType = 0;
      }
      
      // Update local state immediately for responsive UI
      setPostVotes(prev => new Map(prev).set(postId, newVoteType));
      
      // Update post votes count
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          let upvotes = post.upvotes || 0;
          let downvotes = post.downvotes || 0;
          
          if (currentVote === 1) upvotes--;
          if (currentVote === -1) downvotes--;
          if (newVoteType === 1) upvotes++;
          if (newVoteType === -1) downvotes++;
          
          return { ...post, upvotes, downvotes };
        }
        return post;
      }));
      
      // Send vote to database
      const { error } = await supabase
        .from('post_votes')
        .upsert({
          post_id: postId,
          user_id: user.id,
          vote_type: newVoteType
        });
      
      if (error) {
        console.error('Error saving vote:', error);
        // Revert local state on error
        setPostVotes(prev => new Map(prev).set(postId, currentVote));
      }
    } catch (err) {
      console.error('Error handling vote:', err);
    }
  };

  // Toggle comments visibility
  const toggleComments = async (postId) => {
    if (showComments.has(postId)) {
      setShowComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      setShowComments(prev => new Set(prev).add(postId));
      await loadComments(postId);
    }
  };

  // Load comments for a post
  const loadComments = async (postId) => {
    if (comments.has(postId)) return; // Already loaded
    
    setCommentsLoading(prev => new Map(prev).set(postId, true));
    try {
      const { data: postComments, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user_profiles!inner(full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (!error && postComments) {
        setComments(prev => new Map(prev).set(postId, postComments));
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setCommentsLoading(prev => new Map(prev).set(postId, false));
    }
  };

  // Create a new comment
  const handleCreateComment = async (postId) => {
    const commentText = newComment.get(postId);
    if (!commentText || !commentText.trim() || !user) return;
    
    try {
      const { data: newCommentData, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: commentText.trim()
        })
        .select()
        .single();

      if (!error && newCommentData) {
        // Add the new comment to the list
        setComments(prev => {
          const currentComments = prev.get(postId) || [];
          return new Map(prev).set(postId, [...currentComments, newCommentData]);
        });
        
        // Clear the input
        setNewComment(prev => new Map(prev).set(postId, ''));
        
        // Update post comment count
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return { ...post, comment_count: (post.comment_count || 0) + 1 };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error('Error creating comment:', err);
    }
  };

  // Navigate to community page to view post
  const openPostDetail = (post) => {
    // Navigate to community page with the post ID to view details
    window.location.href = `/community?post=${post.id}`;
  };

  // User search functionality for best friends
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }
    
    console.log('Searching for users with query:', query);
    setUserSearchLoading(true);
    try {
      // First, let's check what users exist in the user_profiles table
      const { data: allUsers, error: allUsersError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, username, avatar_url')
        .limit(20);
      
      console.log('All users in user_profiles table:', allUsers);
      if (allUsersError) console.error('Error fetching all users:', allUsersError);

      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, username, avatar_url')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(10);

      if (error) console.error('Search error:', error);

      if (!error && users) {
        setUserSearchResults(users);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setUserSearchLoading(false);
    }
  };

  const selectUser = (selectedUser) => {
    // Check for different possible field names
    const displayName = selectedUser.full_name || selectedUser.fullName || selectedUser.name || selectedUser.display_name;
    const username = selectedUser.username || selectedUser.user_name;
    
    // Determine the best display name and username
    let finalDisplayName = displayName;
    let finalUsername = username;
    
    // If no display name, use username as display name
    if (!finalDisplayName || finalDisplayName.trim() === '') {
      finalDisplayName = finalUsername || 'Unknown User';
    }
    
    // If no username, create one from display name
    if (!finalUsername || finalUsername.trim() === '') {
      finalUsername = finalDisplayName ? finalDisplayName.toLowerCase().replace(/[^a-z0-9]/g, '') : 'user';
    }
    
    // Ensure username starts with @
    if (!finalUsername.startsWith('@')) {
      finalUsername = '@' + finalUsername;
    }
    
    const newFriend = {
      id: Date.now(),
      displayName: finalDisplayName,
      username: finalUsername,
      avatar: selectedUser.avatar_url || selectedUser.avatar || "",
      userId: selectedUser.user_id || selectedUser.userId
    };
    
    setBestFriends(prev => [...prev, newFriend]);
    setShowUserSearch(false);
    setUserSearchQuery("");
    setUserSearchResults([]);
  };

  // Debug function to check if a user exists
  const checkUserExists = async (username) => {
    console.log('Checking if user exists:', username);
    try {
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .single();
      
      console.log('User check result:', { user, error });
      return user;
    } catch (err) {
      console.log('Error checking user:', err);
      return null;
    }
  };

  // Debug function to check all users in the table
  const checkAllUsers = async () => {
    console.log('Checking all users in user_profiles table...');
    try {
      const { data: allUsers, error } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, username, avatar_url')
        .limit(10);
      
      if (error) {
        console.error('Error fetching all users:', error);
        return;
      }
      
      console.log('All users in table:', allUsers);
      console.log('Sample user fields:', allUsers[0] ? Object.keys(allUsers[0]) : 'No users found');
      
      // Check if full_name fields have data
      allUsers.forEach((user, index) => {
        console.log(`User ${index + 1}:`, {
          user_id: user.user_id,
          full_name: user.full_name,
          username: user.username,
          has_full_name: !!user.full_name,
          full_name_length: user.full_name ? user.full_name.length : 0
        });
      });
      
    } catch (err) {
      console.error('Error checking all users:', err);
    }
  };

  const removeBestFriend = (index) => {
    setBestFriends(prev => prev.filter((_, i) => i !== index));
  };

  const editBestFriend = (index, field, value) => {
    setBestFriends(prev => prev.map((friend, i) => 
      i === index ? { ...friend, [field]: value } : friend
    ));
  };
  
  // Now we can do conditional returns after ALL hooks are called
  if (!user) {
    console.log('No user found, cannot load profile');
    return <div>Please log in to view your profile.</div>;
  }



  const handleSaveProfile = async () => {
    console.log('=== HANDLE SAVE PROFILE START ===');
    console.log('Current profile data:', profileData);
    console.log('Current customization:', customization);
    
    // Prevent saving if profile data isn't loaded yet
    if (!profileData.username && !profileData.full_name) {
      alert('Profile data is still loading. Please wait a moment and try again.');
      return;
    }
    
    const success = await saveProfileData();
    console.log('Save result:', success);
    
    if (success) {
      console.log('Save successful, closing modal and reloading data...');
    setShowEditModal(false);
      // Reload profile data to ensure UI reflects saved changes
      if (user) {
        const loadProfileData = async () => {
          try {
            console.log('Reloading profile data...');
            const { data, error } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', user.id)
              .single();

            if (error && error.code !== 'PGRST116') {
              console.error('Error reloading profile:', error);
              return;
            }

            if (data) {
              console.log('Reloaded profile data:', data);
              setProfileData(prev => ({
                ...prev,
                ...data,
                tags: data.tags || []
              }));
              
              if (data.customization) {
                console.log('Reloaded customization:', data.customization);
                setCustomization(prev => ({
                  ...prev,
                  ...data.customization
                }));
              }
            }
          } catch (error) {
            console.error('Error reloading profile:', error);
          }
        };
        loadProfileData();
      }
    } else {
      console.log('Save failed, keeping modal open');
    }
    console.log('=== HANDLE SAVE PROFILE END ===');
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
  };

  const saveProfileData = async () => {
    try {
      console.log('=== SAVE PROFILE START ===');
      console.log('User ID:', user.id);
      console.log('Profile data to save:', {
          user_id: user.id,
          username: profileData.username,
        full_name: profileData.full_name || profileData.fullName,
          bio: profileData.bio,
          location: profileData.location,
          website: profileData.website,
          instagram: profileData.instagram,
          avatar_url: profileData.avatar,
          banner_url: profileData.banner,
          tags: profileData.tags,
          customization: customization
        });

      // Test database connection first
      console.log('Testing database connection...');
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Database connection test failed:', testError);
        alert(`Database connection failed: ${testError.message}`);
        return false;
      }
      console.log('Database connection successful');
      
      // Check if customization column exists
      console.log('Checking if customization column exists...');
      const { data: columnCheck, error: columnError } = await supabase
        .from('user_profiles')
        .select('customization')
        .limit(1);
      
      if (columnError) {
        console.error('Customization column check failed:', columnError);
        console.log('This might mean the customization column is missing from the database');
      } else {
        console.log('Customization column exists, sample data:', columnCheck);
      }

      // First check if profile exists and get current data
      console.log('Checking if profile exists...');
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, username')
        .eq('user_id', user.id)
        .single();

      console.log('Profile check result:', { existingProfile, checkError });

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', checkError);
        alert(`Failed to check profile: ${checkError.message}`);
        return false;
      }

      // Ensure username is available for saving
      let usernameToSave = profileData.username;
      if (!usernameToSave && existingProfile && existingProfile.username) {
        usernameToSave = existingProfile.username;
      }
      
      // If still no username, try to generate one from the full name
      if (!usernameToSave && profileData.full_name) {
        usernameToSave = profileData.full_name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 20);
        
        // Add a timestamp to ensure uniqueness
        usernameToSave = `${usernameToSave}_${Date.now().toString().slice(-4)}`;
        console.log('Generated fallback username:', usernameToSave);
      }
      
      console.log('Username validation:', {
        profileDataUsername: profileData.username,
        existingProfileUsername: existingProfile?.username,
        fullName: profileData.full_name,
        finalUsernameToSave: usernameToSave
      });
      
      if (!usernameToSave) {
        alert('Username is required and could not be generated. Please refresh the page and try again.');
        return false;
      }

      let result;
      if (existingProfile) {
        // Update existing profile
        console.log('Updating existing profile with ID:', existingProfile.id);
        
        // Try to save without customization first to test basic functionality
        const updateData = {
          username: usernameToSave,
          full_name: profileData.full_name || profileData.fullName,
          bio: profileData.bio,
          location: profileData.location,
          website: profileData.website,
          instagram: profileData.instagram,
          avatar_url: profileData.avatar,
          banner_url: profileData.banner,
          tags: profileData.tags
        };
        
        // Only add customization if the column exists
        if (columnCheck && columnCheck.length > 0) {
          const widgetData = {
            bestFriends,
            musicPlayer
          };
          console.log('💾 Widget data being saved:', widgetData);
          
          updateData.customization = {
            ...customization,
            // Include widget data
            ...widgetData
          };
          console.log('💾 Final customization object:', updateData.customization);
        }
        
        console.log('Update data:', updateData);
        
        result = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', existingProfile.id);
          
        console.log('Update result:', result);
      } else {
        // Insert new profile
        console.log('Creating new profile for user:', user.id);
        
        const insertData = {
          user_id: user.id,
          username: usernameToSave,
          full_name: profileData.full_name || profileData.fullName,
          bio: profileData.bio,
          location: profileData.location,
          website: profileData.website,
          instagram: profileData.instagram,
          avatar_url: profileData.avatar,
          banner_url: profileData.banner,
          tags: profileData.tags
        };
        
        // Only add customization if the column exists
        if (columnCheck && columnCheck.length > 0) {
          const widgetData = {
            bestFriends,
            musicPlayer
          };
          console.log('💾 Widget data being saved (INSERT):', widgetData);
          
          insertData.customization = {
            ...customization,
            // Include widget data
            ...widgetData
          };
          console.log('💾 Final customization object (INSERT):', insertData.customization);
        }
        
        console.log('Insert data:', insertData);
        
        result = await supabase
          .from('user_profiles')
          .insert(insertData);
          
        console.log('Insert result:', result);
      }

      if (result.error) {
        console.error('Supabase error saving profile:', result.error);
        alert(`Failed to save profile: ${result.error.message}`);
        return false;
      }
      
      console.log('Profile saved successfully!');
      console.log('=== SAVE PROFILE END ===');
      return true;
    } catch (error) {
      console.error('Unexpected error saving profile:', error);
      alert(`Failed to save profile: ${error.message}`);
      return false;
    }
  };

  const handleImageUpload = async (type, file) => {
    if (!file) return;

    try {
      console.log(`=== UPLOADING ${type.toUpperCase()} ===`);
      console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      console.log('Uploading to path:', filePath);

      // First check if the storage bucket exists
      console.log('Attempting to list storage buckets...');
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      console.log('Bucket list response:', { buckets, bucketError });
      console.log('Available buckets:', buckets);
      console.log('Bucket error:', bucketError);
      
      if (bucketError) {
        console.error('Error listing buckets:', bucketError);
        throw new Error(`Failed to access storage: ${bucketError.message}`);
      }
      
      // Try to directly access the profile-images bucket
      console.log('Trying to directly access profile-images bucket...');
      try {
        const { data: bucketInfo, error: bucketAccessError } = await supabase.storage
        .from('profile-images')
          .list('', { limit: 1 });
        
        console.log('Direct bucket access result:', { bucketInfo, bucketAccessError });
        
        if (!bucketAccessError) {
          console.log('Successfully accessed profile-images bucket directly');
          // Use the bucket directly since we can access it
          const bucketName = 'profile-images';
          console.log(`Using bucket: ${bucketName}, uploading file...`);
          
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
            console.error('Upload error:', uploadError);
        throw uploadError;
      }

          console.log('File uploaded successfully, getting public URL...');

      const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
        .getPublicUrl(filePath);

          console.log('Public URL:', publicUrl);

          // Update local state
      if (type === 'avatar') {
        setProfileData(prev => ({ ...prev, avatar: publicUrl }));
            console.log('Updated avatar in local state');
      } else if (type === 'banner') {
        setProfileData(prev => ({ ...prev, banner: publicUrl }));
            console.log('Updated banner in local state');
          }

          // Save to database
          console.log('Saving profile data to database...');
          const saveSuccess = await saveProfileData();
          
          if (saveSuccess) {
            console.log(`${type} upload and save completed successfully`);
            alert(`${type} updated successfully!`);
          } else {
            console.error('Failed to save profile data after upload');
            alert(`Upload succeeded but failed to save profile. Please try saving manually.`);
          }
          return; // Exit early since we handled the upload
        }
      } catch (directAccessError) {
        console.log('Direct bucket access failed:', directAccessError);
      }

      // Try to find the correct bucket name
      let bucketName = 'profile-images';
      let profileImagesBucket = buckets.find(bucket => bucket.name === bucketName);
      
      // If not found, try alternative names
      if (!profileImagesBucket) {
        const alternativeNames = ['profile_images', 'profileimages', 'images', 'photos', 'avatars'];
        for (const altName of alternativeNames) {
          profileImagesBucket = buckets.find(bucket => bucket.name === altName);
          if (profileImagesBucket) {
            bucketName = altName;
            console.log(`Found bucket with alternative name: ${bucketName}`);
            break;
          }
        }
      }
      
      if (!profileImagesBucket) {
        console.log('No suitable bucket found, available buckets:', buckets.map(b => b.name));
        console.log('Available bucket names:', buckets.map(b => b.name));
        
        // Check if there are any buckets that might be for images
        const imageBuckets = buckets.filter(b => 
          b.name.toLowerCase().includes('image') || 
          b.name.toLowerCase().includes('photo') || 
          b.name.toLowerCase().includes('avatar') ||
          b.name.toLowerCase().includes('profile')
        );
        
        if (imageBuckets.length > 0) {
          console.log('Found potential image buckets:', imageBuckets.map(b => b.name));
          throw new Error(`No suitable storage bucket found. Found similar buckets: ${imageBuckets.map(b => b.name).join(', ')}. Please check the bucket name in your Supabase dashboard.`);
        } else {
          throw new Error(`No suitable storage bucket found. Available buckets: ${buckets.map(b => b.name).join(', ')}. Please create a bucket for profile images or update the code to use an existing bucket.`);
        }
      }

      console.log(`Using bucket: ${bucketName}, uploading file...`);

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully, getting public URL...');

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Update local state
      if (type === 'avatar') {
        setProfileData(prev => ({ ...prev, avatar: publicUrl }));
        console.log('Updated avatar in local state');
      } else if (type === 'banner') {
        setProfileData(prev => ({ ...prev, banner: publicUrl }));
        console.log('Updated banner in local state');
      }

      // Save to database
      console.log('Saving profile data to database...');
      const saveSuccess = await saveProfileData();
      
      if (saveSuccess) {
        console.log(`${type} upload and save completed successfully`);
        alert(`${type} updated successfully!`);
      } else {
        console.error('Failed to save profile data after upload');
        alert(`Upload succeeded but failed to save profile. Please try saving manually.`);
      }
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      alert(`Failed to upload ${type}: ${error.message}`);
    }
  };

  const handleTagChange = (index, value) => {
    const newTags = [...profileData.tags];
    newTags[index] = value;
    setProfileData(prev => ({ ...prev, tags: newTags }));
  };

  const addTag = () => {
    if (profileData.tags.length < 5) {
      setProfileData(prev => ({ ...prev, tags: [...prev.tags, ""] }));
    }
  };

  const removeTag = (index) => {
    setProfileData(prev => ({ 
      ...prev, 
      tags: prev.tags.filter((_, i) => i !== index) 
    }));
  };

  const addBestFriend = () => {
    if (bestFriends.length < 8) {
      setBestFriends(prev => [...prev, {
        id: Date.now(),
        username: "",
        displayName: "",
        avatar: ""
      }]);
    }
  };

  // Post creation functions
  const handlePostImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    setPostData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const removePostImage = (index) => {
    setPostData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleCreatePost = () => {
    if (!postData.content.trim()) {
      alert("Please write something to post!");
      return;
    }
    
    // Here you would typically save the post to your database
    // For now, we'll just show a success message and close the modal
    alert("Post created successfully! It will appear in the community feed.");
    
    // Reset post data
    setPostData({
      title: "",
      content: "",
      images: [],
      community: "",
      topic: ""
    });
    
    setShowPostModal(false);
  };

  const resetPostData = () => {
    setPostData({
      title: "",
      content: "",
      images: [],
      community: "",
      topic: ""
    });
  };
  
  const updateMusicPlayer = (field, value) => {
    setMusicPlayer(prev => ({ ...prev, [field]: value }));
  };
  
  const toggleMusicPlay = () => {
    setMusicPlayer(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const applyTheme = async (themeName) => {
    const themes = {
      default: {
        backgroundColor: userTheme === 'dark' ? "#000000" : "#ffffff",
        accentColor: "#3b82f6",
        headerTextColor: userTheme === 'dark' ? "#ffffff" : "#000000",
        bodyTextColor: userTheme === 'dark' ? "#ffffff" : "#000000"
      },
      dark: {
        backgroundColor: "#1f2937",
        accentColor: "#60a5fa",
        headerTextColor: "#f9fafb",
        bodyTextColor: "#d1d5db"
      },
      nature: {
        backgroundColor: "#f0fdf4",
        accentColor: "#16a34a",
        headerTextColor: "#14532d",
        bodyTextColor: "#166534"
      },
      ocean: {
        backgroundColor: "#f0f9ff",
        accentColor: "#0284c7",
        headerTextColor: "#0c4a6e",
        bodyTextColor: "#0369a1"
      },
      sunset: {
        backgroundColor: "#fef3c7",
        accentColor: "#ea580c",
        headerTextColor: "#92400e",
        bodyTextColor: "#c2410c"
      }
    };

    // When applying a theme, we want to completely override any custom colors
    // This ensures the theme is applied correctly regardless of previous customizations
    const newCustomization = {
      ...customization,
      theme: themeName,
      ...themes[themeName]
    };
    
    setCustomization(newCustomization);
    
    // Automatically save the theme choice to the database
    try {
      console.log('Auto-saving theme choice:', themeName);
      await saveCustomization();
    } catch (error) {
      console.error('Failed to auto-save theme:', error);
    }
  };

  const resetToThemeDefaults = () => {
    // Reset colors to the default values for the current theme
    applyTheme(customization.theme);
  };

  const resetToBaseTheme = () => {
    // Reset to base theme and clear any custom color overrides
    setIsResettingTheme(true);
    setCustomization(prev => ({
      ...prev,
      theme: 'default',
      backgroundColor: userTheme === 'dark' ? "#000000" : "#ffffff",
      accentColor: "#3b82f6",
      headerTextColor: userTheme === 'dark' ? "#ffffff" : "#000000",
      bodyTextColor: userTheme === 'dark' ? "#ffffff" : "#000000"
    }));
    // Reset the flag after a short delay to allow the state update to complete
    setTimeout(() => setIsResettingTheme(false), 100);
  };

  // Helper function to get card background color
  const getCardBackgroundColor = () => {
    // If user has explicitly chosen a theme (not 'default'), use CSS variables
    if (customization.theme !== 'default') {
      return 'var(--panel)';
    }
    
    // If using default theme, check user's system preference
    if (userTheme === 'dark') {
      return '#161616'; // Solid dark background for dark mode
    }
    
    return 'var(--panel)'; // Use CSS variable for light mode
  };
  
  // Debug logging for card background color (after function is defined)
  console.log('Card background color:', getCardBackgroundColor());
  console.log('Current theme state:', {
    customizationTheme: customization.theme,
    userTheme: userTheme,
    backgroundColor: customization.backgroundColor,
    headerTextColor: customization.headerTextColor,
    bodyTextColor: customization.bodyTextColor,
    customizationLoaded: customizationLoaded,
    isResettingTheme: isResettingTheme
  });

  const saveCustomization = async () => {
    try {
      console.log('Saving customization:', customization);
      
      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', checkError);
        alert(`Failed to check profile: ${checkError.message}`);
        return false;
      }

      let result;
      if (existingProfile) {
        // Update existing profile
        console.log('Updating customization for existing profile with ID:', existingProfile.id);
        result = await supabase
          .from('user_profiles')
          .update({
            customization: customization
          })
          .eq('id', existingProfile.id);
      } else {
        // Insert new profile with customization
        console.log('Creating new profile with customization for user:', user.id);
        result = await supabase
          .from('user_profiles')
          .insert({
          user_id: user.id,
          customization: customization
        });
      }

      if (result.error) {
        console.error('Supabase error saving customization:', result.error);
        alert(`Failed to save customization: ${result.error.message}`);
        return false;
      }
      
      console.log('Customization saved successfully');
      setShowCustomizeModal(false);
      return true;
    } catch (error) {
      console.error('Unexpected error saving customization:', error);
      alert(`Failed to save customization: ${error.message}`);
      return false;
    }
  };

  const gallery = posts.flatMap(p => p.images || []);
  console.log('Gallery variable contents:', gallery);
  console.log('Posts from database:', posts);
  console.log('Posts loading:', postsLoading);

  console.log('sidebarWidgets:', customization.sidebarWidgets);

  return (
    <>
      {/* Full-screen background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: customization.backgroundType === 'photo' && customization.backgroundPhoto 
          ? `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${customization.backgroundPhoto})`
          : customization.backgroundColor,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        zIndex: -1
      }} />
      
      {/* Content container */}
      <div className="container" style={{ 
        paddingTop: "0",
        marginTop: "16px",
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <Card className="card" style={{ 
          overflow: "hidden", 
          position: "relative",
          backgroundColor: getCardBackgroundColor(),
          backdropFilter: 'none'
        }}>
          <div style={{ 
            position: "relative", 
            height: 200, 
            background: profileData.banner && profileData.banner.trim() !== "" 
              ? `url(${profileData.banner}) center/cover`
              : `linear-gradient(135deg, ${customization.accentColor}, ${customization.accentColor}dd)`
          }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,0))" }} />
          </div>
          
          {/* Profile Picture - Positioned to overlap banner */}
          <div style={{ position: "absolute", top: 180, left: 24, zIndex: 10 }}>
            {profileData.avatar && profileData.avatar.trim() !== "" ? (
            <img
              src={profileData.avatar}
              alt="Profile"
              style={{
                height: 96, width: 96, borderRadius: 999, objectFit: "cover",
                border: "4px solid var(--bg, #fff)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}
            />
            ) : (
              <div
                style={{
                  height: 96, width: 96, borderRadius: 999,
                  border: "4px solid var(--bg, #fff)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  background: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text)"
                }}
              >
                <PawPrint size={32} />
              </div>
            )}
          </div>
          
          {/* Content below banner */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 16px 16px 140px" }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, color: customization.headerTextColor }}>
                {profileData.full_name || profileData.fullName || user?.user_metadata?.full_name || "Animal Lover"}
              </h2>
              {profileData.username && (
                <div className="muted" style={{ fontSize: 16, color: customization.accentColor, fontWeight: 500, marginBottom: 4 }}>
                  @{profileData.username}
                </div>
              )}
              <div className="muted" style={{ fontSize: 14, color: customization.bodyTextColor }}>
                Animal Advocate • {profileData.location || "Portland, OR"}
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4, display: "flex", gap: 12, alignItems: "center", color: customization.bodyTextColor }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={14} /> {profileData.location || "Portland, OR"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Users size={14} /> {profileData.followers || 0} followers
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={() => setShowPostModal(true)}>
                <Plus size={16}/> Create Post
              </Button>
              <Button onClick={() => setShowEditModal(true)}>Edit Profile</Button>
              {profileData.user_type === 'organization' && (
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/dashboard'}
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  View Dashboard
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowCustomizeModal(true)}>Customize</Button>
              <Button variant="ghost"><Share2 size={16}/> Share</Button>
            </div>
          </div>
        </Card>

        {/* Main Content Container */}
        <div>
          {/* Tabs */}
          <Card className="card" style={{ 
            padding: 8, 
            marginTop: 24,
            marginBottom: 16,
            backgroundColor: getCardBackgroundColor(),
            backdropFilter: 'none'
          }}>
            <div style={{ display: "flex", gap: 8 }}>
              {["Timeline", "Gallery", "About"].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`chip ${tab === t ? "active" : ""}`}
                  style={{ padding: "8px 14px" }}
                >
                  {t}
                </button>
              ))}
            </div>
          </Card>

          {/* Body: sidebar + main */}
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }}>
            {/* Sidebar */}
            <div>
              {/* About Section */}
              {customization.sidebarWidgets.includes('about') && (
                <Card className="card" style={{ 
                  padding: 16, 
                  width: "100%", 
                  marginBottom: 16,
                  backgroundColor: getCardBackgroundColor(),
                  backdropFilter: 'none'
                }}>
                  <h3 style={{ marginTop: 0, color: customization.headerTextColor }}>About</h3>
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: 0, lineHeight: 1.5, fontSize: 14, color: customization.bodyTextColor }}>
                      {profileData.bio}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {profileData.tags && profileData.tags.length > 0 ? (
                      profileData.tags.map((tag, index) => (
                        <span key={index} className="chip" style={{ backgroundColor: customization.accentColor, color: 'white' }}>
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '14px', fontStyle: 'italic' }}>
                        No tags added yet
                      </span>
                    )}
                  </div>
                </Card>
              )}

              {/* Activity Stats */}
              {customization.sidebarWidgets.includes('activity-stats') && (
                <Card className="card" style={{ 
                  padding: 16, 
                  width: "100%", 
                  marginBottom: 16,
                  backgroundColor: getCardBackgroundColor(),
                  backdropFilter: 'none'
                }}>
                  <h3 style={{ marginTop: 0, color: customization.headerTextColor }}>Activity</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 14 }}>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: customization.accentColor }}>
                        {profileData.followers}
                      </div>
                      <div className="muted" style={{ color: customization.bodyTextColor }}>Followers</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: customization.accentColor }}>
                        {profileData.animalsHelped}
                      </div>
                      <div className="muted" style={{ color: customization.bodyTextColor }}>Animals Helped</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: customization.accentColor }}>
                        {profileData.sanctuariesSupported}
                      </div>
                      <div className="muted" style={{ color: customization.bodyTextColor }}>Sanctuaries</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: customization.accentColor }}>
                        {profileData.daysActive}
                      </div>
                      <div className="muted" style={{ color: customization.bodyTextColor }}>Days Active</div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Recent Activity */}
              {customization.sidebarWidgets.includes('recent-activity') && (
                <Card className="card" style={{ 
                  padding: 16, 
                  width: "100%", 
                  marginBottom: 16,
                  backgroundColor: getCardBackgroundColor(),
                  backdropFilter: 'none'
                }}>
                  <h3 style={{ marginTop: 0, color: customization.headerTextColor }}>Recent Activity</h3>
                  <div style={{ fontSize: 14, color: customization.bodyTextColor }}>
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '20px', 
                      color: 'var(--muted)',
                      fontSize: '14px'
                    }}>
                      <p style={{ margin: '0 0 8px 0' }}>No recent activity</p>
                      <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>
                        Your activity will appear here as you engage with the community
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Music Player Widget */}
              {customization.sidebarWidgets.includes('music-player') && (
                <Card className="card" style={{ 
                  padding: 16, 
                  width: "100%", 
                  marginBottom: 16,
                  backgroundColor: getCardBackgroundColor(),
                  backdropFilter: 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ marginTop: 0, color: customization.headerTextColor }}>Music Player</h3>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={toggleMusicPlay}
                      style={{ 
                        backgroundColor: musicPlayer.isPlaying ? customization.accentColor : 'transparent',
                        color: musicPlayer.isPlaying ? 'white' : customization.accentColor,
                        borderColor: customization.accentColor
                      }}
                    >
                      {musicPlayer.isPlaying ? '⏸️' : '▶️'}
                    </Button>
                  </div>
                  
                  {/* Album Art with Animation */}
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ 
                      position: 'relative',
                      display: 'inline-block'
                    }}>
                      <img 
                        src={musicPlayer.albumArt}
                        alt="Album"
                        style={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: 8,
                          animation: musicPlayer.isPlaying ? 'rotate 3s linear infinite' : 'none'
                        }}
                      />
                      {musicPlayer.isPlaying && (
                        <div style={{
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: customization.accentColor,
                          animation: 'pulse 1s ease-in-out infinite alternate'
                        }} />
                      )}
                    </div>
                  </div>
                  
                  {/* Song Info - Editable */}
                  <div style={{ marginBottom: 16 }}>
                    <input
                      type="text"
                      value={musicPlayer.songTitle}
                      onChange={(e) => updateMusicPlayer('songTitle', e.target.value)}
                      placeholder="Song title"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: customization.headerTextColor,
                        fontWeight: 600,
                        fontSize: 16,
                        width: '100%',
                        textAlign: 'center',
                        marginBottom: 4
                      }}
                    />
                    <input
                      type="text"
                      value={musicPlayer.artist}
                      onChange={(e) => updateMusicPlayer('artist', e.target.value)}
                      placeholder="Artist name"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: customization.bodyTextColor,
                        fontSize: 14,
                        width: '100%',
                        textAlign: 'center',
                        opacity: 0.8
                      }}
                    />
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{ 
                    width: '100%', 
                    height: 4, 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    borderRadius: 2,
                    marginBottom: 12
                  }}>
                    <div style={{
                      width: `${musicPlayer.progress}%`,
                      height: '100%',
                      backgroundColor: customization.accentColor,
                      borderRadius: 2,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  
                  {/* Upload Album Art */}
                  <div style={{ textAlign: 'center' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files[0] && updateMusicPlayer('albumArt', URL.createObjectURL(e.target.files[0]))}
                      style={{ display: 'none' }}
                      id="album-art-upload"
                    />
                    <label htmlFor="album-art-upload">
                      <Button size="sm" variant="outline" style={{ fontSize: 12, cursor: 'pointer' }}>
                        Change Album Art
                      </Button>
                    </label>
                  </div>
                </Card>
              )}

              {/* Best Friends Widget */}
              {customization.sidebarWidgets.includes('best-friends') && (
                <Card className="card" style={{ 
                  padding: 16, 
                  width: "100%", 
                  marginBottom: 16,
                  backgroundColor: getCardBackgroundColor(),
                  backdropFilter: 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ marginTop: 0, color: customization.headerTextColor }}>Best Friends</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowUserSearch(true)}
                        disabled={bestFriends.length >= 8}
                        style={{ fontSize: 12 }}
                      >
                        Tag User
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={addBestFriend}
                        disabled={bestFriends.length >= 8}
                        style={{ fontSize: 12 }}
                      >
                        + Add Friend
                      </Button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {bestFriends.map((friend, i) => (
                      <div key={friend.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        padding: '8px',
                        borderRadius: '6px',
                        background: 'var(--panel)',
                        border: '1px solid var(--border)'
                      }}>
                        {friend.avatar ? (
                          <img 
                            src={friend.avatar} 
                            alt="Friend"
                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {friend.displayName?.[0]?.toUpperCase() || friend.username?.[0]?.toUpperCase() || 'F'}
                          </div>
                        )}
                        <div style={{ flex: 1, color: customization.bodyTextColor }}>
                          {/* Display Name - Larger, more prominent */}
                          <div style={{ 
                            fontWeight: '600', 
                            fontSize: '14px', 
                            color: customization.headerTextColor,
                            marginBottom: '2px'
                          }}>
                            {friend.displayName || 'Friend Name'}
                          </div>
                          
                          {/* Username - Smaller, with @ symbol */}
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--muted)',
                            fontFamily: 'monospace'
                          }}>
                            @{friend.username || 'username'}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => removeBestFriend(i)}
                          style={{ padding: '2px 6px', fontSize: 10 }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    
                    {/* Empty State */}
                    {bestFriends.length === 0 && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '20px', 
                        color: 'var(--muted)',
                        fontSize: '14px'
                      }}>
                        <p style={{ margin: '0 0 8px 0' }}>No friends added yet</p>
                        <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>
                          Use "Tag User" to add real users or "Add Friend" for manual entries
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* User Search Modal for Best Friends */}
              {showUserSearch && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}>
                  <Card className="card" style={{
                    padding: 24,
                    maxWidth: 500,
                    width: '90%',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    backgroundColor: getCardBackgroundColor(),
                    backdropFilter: 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <h3 style={{ margin: 0, color: customization.headerTextColor }}>Tag a User</h3>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowUserSearch(false)}
                        style={{ padding: '4px 8px' }}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                    
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <Input
                          placeholder="Search by name or username..."
                          value={userSearchQuery}
                          onChange={(e) => {
                            setUserSearchQuery(e.target.value);
                            searchUsers(e.target.value);
                          }}
                          style={{ flex: 1 }}
                        />

                      </div>
                      
                      {userSearchLoading && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                          <div style={{ animation: 'spin 1s linear infinite', fontSize: '16px' }}>⟳</div>
                          <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Searching users...</p>
                        </div>
                      )}
                      
                      {userSearchResults.length > 0 && (
                        <div style={{ display: 'grid', gap: 8 }}>
                          {userSearchResults.map((user) => (
                            <div 
                              key={user.user_id}
                              onClick={() => selectUser(user)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: 'var(--bg)'
                              }}
                              onMouseEnter={(e) => e.target.parentElement.style.background = 'var(--panel)'}
                              onMouseLeave={(e) => e.target.parentElement.style.background = 'var(--bg)'}
                            >
                              {user.avatar_url ? (
                                <img 
                                  src={user.avatar_url} 
                                  alt="User"
                                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{
                                  width: 40, 
                                  height: 40, 
                                  borderRadius: '50%',
                                  background: 'var(--accent)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '16px',
                                  fontWeight: '600'
                                }}>
                                  {user.full_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)' }}>
                                  {user.full_name || user.username}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                  {user.username ? `@${user.username}` : 'No username'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {userSearchQuery && !userSearchLoading && userSearchResults.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                          <p>No users found matching "{userSearchQuery}"</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}


            </div>

            {/* Main Content */}
            <div>
              {tab === "Timeline" && (
                <>
                  {/* Quick Post Creation Card */}
                  <Card className="card" style={{ 
                    padding: 16,
                    backgroundColor: getCardBackgroundColor(),
                    backdropFilter: 'none',
                    marginBottom: 16
                  }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                      {profileData.avatar && profileData.avatar.trim() !== "" ? (
                        <img 
                          src={profileData.avatar} 
                          alt="Profile" 
                          style={{ height: 40, width: 40, borderRadius: 999, objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            height: 40, width: 40, borderRadius: 999,
                            background: "var(--muted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text)"
                          }}
                        >
                          <PawPrint size={20} />
                        </div>
                      )}
                      <Input 
                        placeholder="What's happening in the animal world?" 
                        style={{ flex: 1 }}
                        value={postData.content}
                        onChange={(e) => setPostData({ ...postData, content: e.target.value })}
                        onFocus={() => setShowPostModal(true)}
                      />
                      {postData.content.trim() && (
                        <Button 
                          size="sm" 
                          onClick={() => setShowPostModal(true)}
                          style={{ flexShrink: 0 }}
                        >
                          Post
                        </Button>
                      )}
                    </div>
                    <div className="muted" style={{ display: "flex", gap: 16, fontSize: 14 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }} onClick={() => setShowPostModal(true)}>
                        <Camera size={16}/> Photo/Video
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }} onClick={() => setShowPostModal(true)}>
                        <MessageCircle size={16}/> Poll
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }} onClick={() => setShowPostModal(true)}>
                        <Users size={16}/> Tag Community
                      </span>
                    </div>
                  </Card>

                  {/* Timeline Content */}
                  <Card className="card" style={{ 
                    padding: 16,
                    backgroundColor: getCardBackgroundColor(),
                    backdropFilter: 'none'
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={{ margin: 0, color: customization.headerTextColor }}>Timeline</h3>
                      <Button 
                        size="sm" 
                        onClick={() => loadUserPosts()}
                        style={{ fontSize: "12px" }}
                      >
                        Refresh Posts
                      </Button>
                    </div>
                    
                    {postsLoading ? (
                      <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                        <div style={{ animation: "spin 1s linear infinite", fontSize: "16px" }}>⟳</div>
                        <p style={{ margin: "8px 0 0 0", fontSize: "14px" }}>Loading posts...</p>
                      </div>
                    ) : posts.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                        <MessageCircle size={32} style={{ marginBottom: "16px", opacity: 0.5 }}/>
                        <p style={{ margin: 0, fontSize: "16px" }}>No posts yet</p>
                        <p style={{ margin: "8px 0 0 0", fontSize: "14px", opacity: 0.7 }}>
                          Share something with the community to get started!
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 16 }}>
                        {posts.map((post) => (
                          <div key={post.id} style={{ 
                            padding: "16px", 
                            border: "1px solid var(--border)", 
                            borderRadius: "8px",
                            background: "var(--bg)"
                          }}>
                            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                              <div style={{ height: 40, width: 40, borderRadius: 999, background: "var(--accent)", display: "grid", placeItems: "center", color: "white", fontSize: "16px", fontWeight: "600" }}>
                                {profileData.full_name?.[0]?.toUpperCase() || profileData.fullName?.[0]?.toUpperCase() || user?.user_metadata?.full_name?.[0]?.toUpperCase() || "U"}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: "14px" }}>
                                  {profileData.full_name || profileData.fullName || user?.user_metadata?.full_name || "Animal Lover"}
                                </div>
                                <div className="muted" style={{ fontSize: "12px" }}>
                                  {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                            
                            {post.title && (
                              <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600" }}>
                                {post.title}
                              </h4>
                            )}
                            
                            <div style={{ fontSize: "14px", lineHeight: 1.5, marginBottom: 12 }}>
                              {post.content}
                            </div>

                            {post.topic && (
                              <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: 8 }}>
                                Topic: <strong>{post.topic}</strong>
                              </div>
                            )}

                            {post.community && (
                              <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: 8 }}>
                                Posted in: <strong>{post.community.name}</strong>
                              </div>
                            )}

                            {/* Voting and Interaction Bar */}
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "space-between",
                              marginTop: 16, 
                              paddingTop: 16, 
                              borderTop: "1px solid var(--border)" 
                            }}>
                              {/* Left side - Voting and Comments */}
                              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                {/* Voting */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePostVote(post.id, 1);
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: postVotes.get(post.id) === 1 ? "var(--accent)" : "var(--muted)",
                                      padding: "8px",
                                      borderRadius: "6px",
                                      transition: "all 0.2s ease",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      height: "36px"
                                    }}
                                  >
                                    <ChevronUp size={16}/>
                                  </button>
                                  <span style={{ 
                                    fontWeight: "600", 
                                    color: postVotes.get(post.id) === 1 ? "var(--accent)" : 
                                           postVotes.get(post.id) === -1 ? "var(--accent)" : "var(--text)" 
                                  }}>
                                    {(post.upvotes || 0) - (post.downvotes || 0)}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePostVote(post.id, -1);
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: postVotes.get(post.id) === -1 ? "var(--accent)" : "var(--muted)",
                                      padding: "8px",
                                      borderRadius: "6px",
                                      transition: "all 0.2s ease",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      height: "36px"
                                    }}
                                  >
                                    <ChevronDown size={16}/>
                                  </button>
                                </div>

                                {/* Comments */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleComments(post.id);
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--muted)",
                                    padding: "8px",
                                    borderRadius: "6px",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "14px"
                                  }}
                                >
                                  <MessageCircle size={16}/>
                                  {post.comment_count || 0}
                                </button>
                              </div>

                              {/* Right side - View Post */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPostDetail(post);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "var(--muted)",
                                  padding: "8px",
                                  borderRadius: "6px",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "14px"
                                }}
                              >
                                <ArrowRight size={16}/>
                                View Post
                              </button>
                            </div>

                            {/* Comments Section */}
                            {showComments.has(post.id) && (
                              <div style={{ 
                                marginTop: 16, 
                                paddingTop: 16, 
                                borderTop: "1px solid var(--border)" 
                              }}>
                                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--text)" }}>
                                  Comments
                                </h4>
                                
                                {/* Display existing comments */}
                                {commentsLoading.get(post.id) ? (
                                  <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                                    <div style={{ animation: "spin 1s linear infinite", fontSize: "16px" }}>⟳</div>
                                    <p style={{ margin: "8px 0 0 0", fontSize: "14px" }}>Loading comments...</p>
                                  </div>
                                ) : (
                                  <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
                                    {(comments.get(post.id) || []).map((comment) => (
                                      <div key={comment.id} style={{ 
                                        padding: "12px", 
                                        background: "var(--panel)", 
                                        borderRadius: "6px",
                                        border: "1px solid var(--border)"
                                      }}>
                                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                          <div style={{ height: 24, width: 24, borderRadius: 999, background: "var(--accent)", display: "grid", placeItems: "center", color: "white", fontSize: "12px", fontWeight: "600" }}>
                                            {comment.user_profiles?.full_name?.[0]?.toUpperCase() || "U"}
                                          </div>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: "600", fontSize: "12px" }}>
                                              {comment.user_profiles?.full_name || "Anonymous User"}
                                            </div>
                                            <div className="muted" style={{ fontSize: "11px" }}>
                                              {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                                            </div>
                                          </div>
                                        </div>
                                        <div style={{ fontSize: "14px", lineHeight: 1.5 }}>
                                          {comment.content}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Add new comment */}
                                <div style={{ display: "flex", gap: 8 }}>
                                  <Textarea
                                    placeholder="Add a comment..."
                                    value={newComment.get(post.id) || ""}
                                    onChange={(e) => setNewComment(prev => new Map(prev).set(post.id, e.target.value))}
                                    style={{ flex: 1, minHeight: "60px", resize: "vertical" }}
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleCreateComment(post.id)}
                                    disabled={!newComment.get(post.id)?.trim()}
                                  >
                                    Comment
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </>
              )}

              {tab === "Gallery" && (
                <Card className="card" style={{ 
                  padding: 16,
                  backgroundColor: getCardBackgroundColor(),
                  backdropFilter: 'none'
                }}>
                  <h3 style={{ marginTop: 0, color: customization.headerTextColor }}>Gallery</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                    {gallery.length > 0 ? (
                      gallery.slice(0, 12).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Gallery"
                        style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 8 }}
                      />
                      ))
                    ) : (
                      <div style={{ 
                        gridColumn: "1 / -1",
                        textAlign: "center",
                        padding: "40px 20px",
                        color: customization.bodyTextColor,
                        opacity: 0.6
                      }}>
                        <p>No images in your gallery yet.</p>
                        <p>Upload images using the Image Gallery widget!</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {tab === "About" && (
                <Card className="card" style={{ 
                  padding: 16,
                  backgroundColor: getCardBackgroundColor(),
                  backdropFilter: 'none'
                }}>
                  <h3 style={{ marginTop: 0, color: customization.headerTextColor }}>About</h3>
                  <div style={{ color: customization.bodyTextColor }}>
                    <p>{profileData.bio}</p>
                    <div style={{ marginTop: 16 }}>
                      <h4>Tags</h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {profileData.tags?.map((tag, index) => (
                          <span key={index} className="chip" style={{ backgroundColor: customization.accentColor, color: 'white' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <h4>Links</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {profileData.website && (
                          <a href={profileData.website} target="_blank" rel="noopener noreferrer" style={{ color: customization.accentColor }}>
                            Website
                          </a>
                        )}
                        {profileData.instagram && (
                          <a href={`https://instagram.com/${profileData.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: customization.accentColor }}>
                            Instagram
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: 16
          }}>
            <Card style={{
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto"
            }}>
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{ margin: 0 }}>Edit Profile</h2>
                  <Button variant="ghost" onClick={handleCancelEdit}><X size={20}/></Button>
                </div>

                <div style={{ display: "grid", gap: 24 }}>
                  {/* Profile Picture */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Profile Picture</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      {profileData.avatar && profileData.avatar.trim() !== "" ? (
                      <img 
                        src={profileData.avatar} 
                        alt="Profile" 
                        style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }}
                      />
                      ) : (
                        <div
                          style={{
                            width: 80, height: 80, borderRadius: "50%",
                            background: "var(--muted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text)"
                          }}
                        >
                          <PawPrint size={24} />
                        </div>
                      )}
                      <div>
                        <Button variant="outline" onClick={() => document.getElementById('avatar-upload').click()}>
                          <Upload size={16}/> Change Photo
                        </Button>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => handleImageUpload('avatar', e.target.files[0])}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Banner Image */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Banner Image</label>
                    <div style={{ position: "relative" }}>
                      {profileData.banner && profileData.banner.trim() !== "" ? (
                      <img 
                        src={profileData.banner} 
                        alt="Banner" 
                        style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8 }}
                      />
                      ) : (
                        <div
                          style={{
                            width: "100%", height: 120,
                            background: "var(--muted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text)",
                            borderRadius: 8
                          }}
                        >
                          <PawPrint size={32} />
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        style={{ position: "absolute", top: 8, right: 8 }}
                        onClick={() => document.getElementById('banner-upload').click()}
                      >
                        <Upload size={16}/> Change Banner
                      </Button>
                      <input
                        id="banner-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleImageUpload('banner', e.target.files[0])}
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Name on Profile</label>
                    <Input
                      value={profileData.full_name || profileData.fullName || ""}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      placeholder="Enter your name as it should appear on your profile"
                    />
                  </div>



                  {/* Bio */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>About Section Bio</label>
                    <Textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell us about yourself, your passion for animals, and what you do..."
                      rows={4}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                      Tags (max 5)
                    </label>
                    <div style={{ display: "grid", gap: 8 }}>
                      {profileData.tags?.map((tag, index) => (
                        <div key={index} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <Input
                            value={tag}
                            onChange={(e) => handleTagChange(index, e.target.value)}
                            placeholder="Enter a tag (e.g., Animal Lover, Advocate)"
                          />
                          <Button 
                            variant="ghost" 
                            onClick={() => removeTag(index)}
                            style={{ color: "var(--error)" }}
                          >
                            <X size={16}/>
                          </Button>
                        </div>
                      ))}
                      {profileData.tags && profileData.tags.length < 5 && (
                        <Button variant="outline" onClick={addTag}>
                          <PawPrint size={16}/> Add Tag
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Links */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Links</label>
                    <div style={{ display: "grid", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Website</label>
                        <Input
                          value={profileData.website}
                          onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                          placeholder="yourwebsite.com"
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Instagram</label>
                        <Input
                          value={profileData.instagram}
                          onChange={(e) => setProfileData({ ...profileData, instagram: e.target.value })}
                          placeholder="@username"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "flex-end" }}>
                  <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Customize Modal */}
        {showCustomizeModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <Card style={{ 
              maxWidth: 600, 
              width: '90%', 
              maxHeight: '90vh', 
              overflow: 'auto',
              padding: 24
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>Customize Profile</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowCustomizeModal(false)}>
                  <X size={20} />
                </Button>
              </div>

              {/* Theme Selection */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 12 }}>Theme</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {['default', 'dark', 'nature', 'ocean', 'sunset'].map(theme => (
                    <Button
                      key={theme}
                      variant={customization.theme === theme ? 'default' : 'outline'}
                      size="sm"
                      onClick={async () => await applyTheme(theme)}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {theme}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Reset to base theme which will follow system theme
                      resetToBaseTheme();
                    }}
                    style={{ marginLeft: 'auto' }}
                  >
                    Reset to System Theme
                  </Button>
                </div>
              </div>

              {/* Background Customization */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 12 }}>Background</h3>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="backgroundType"
                        value="color"
                        checked={customization.backgroundType === 'color'}
                        onChange={(e) => setCustomization({ ...customization, backgroundType: e.target.value })}
                      />
                      Color
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="backgroundType"
                        value="photo"
                        checked={customization.backgroundType === 'photo'}
                        onChange={(e) => setCustomization({ ...customization, backgroundType: e.target.value })}
                      />
                      Photo
                    </label>
                  </div>
                  
                  {customization.backgroundType === 'color' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Background Color</label>
                      <input
                        type="color"
                        value={customization.backgroundColor}
                        onChange={(e) => setCustomization({ ...customization, backgroundColor: e.target.value })}
                        style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 6 }}
                      />
                    </div>
                  )}
                  
                  {customization.backgroundType === 'photo' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Background Photo</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setCustomization({ ...customization, backgroundPhoto: e.target.result });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          style={{ flex: 1 }}
                        />
                        {customization.backgroundPhoto && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCustomization({ ...customization, backgroundPhoto: '' })}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      {customization.backgroundPhoto && customization.backgroundPhoto.trim() !== "" && (
                        <div style={{ marginTop: 8 }}>
                          <img 
                            src={customization.backgroundPhoto} 
                            alt="Background preview" 
                            style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Color Customization */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Colors</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetToThemeDefaults}
                  >
                    Reset to Theme Defaults
                  </Button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Accent Color</label>
                    <input
                      type="color"
                      value={customization.accentColor}
                      onChange={(e) => setCustomization({ ...customization, accentColor: e.target.value })}
                      style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 6 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Header Text Color</label>
                    <input
                      type="color"
                      value={customization.headerTextColor}
                      onChange={(e) => setCustomization({ ...customization, headerTextColor: e.target.value })}
                      style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 6 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Body Text Color</label>
                    <input
                      type="color"
                      value={customization.bodyTextColor}
                      onChange={(e) => setCustomization({ ...customization, bodyTextColor: e.target.value })}
                      style={{ width: '100%', height: 40, border: '1px solid #e2e8f0', borderRadius: 6 }}
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar Widgets */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 12 }}>Sidebar Widgets</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { id: 'about', label: 'About Section', description: 'Bio and tags' },
                    { id: 'activity-stats', label: 'Activity Stats', description: 'Followers, animals helped, etc.' },
                    { id: 'recent-activity', label: 'Recent Activity', description: 'Latest posts and interactions' },
                    { id: 'music-player', label: 'Music Player', description: 'Spotify or custom playlist' },
                    { id: 'best-friends', label: 'Best Friends', description: 'Show your closest connections' },
                    
                  ].map(widget => (
                    <label key={widget.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={customization.sidebarWidgets.includes(widget.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCustomization({
                              ...customization,
                              sidebarWidgets: [...customization.sidebarWidgets, widget.id]
                            });
                          } else {
                            setCustomization({
                              ...customization,
                              sidebarWidgets: customization.sidebarWidgets.filter(id => id !== widget.id)
                            });
                          }
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 500 }}>{widget.label}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{widget.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={() => setShowCustomizeModal(false)}>
                  Cancel
                </Button>
                <Button onClick={saveCustomization}>
                  Save Changes
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Create Post Modal */}
        {showPostModal && (
          <div 
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "grid",
              placeItems: "center",
              zIndex: 1000,
              padding: 16
            }}
          >
            <Card style={{
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto"
            }}>
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{ margin: 0 }}>Create a Post</h2>
                  <Button variant="ghost" onClick={() => {
                    setShowPostModal(false);
                    resetPostData();
                  }}><X size={20}/></Button>
                </div>

                <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--accent)", color: "white", borderRadius: "8px", fontSize: "14px" }}>
                  <strong>💡 Tip:</strong> Your post will appear in the{" "}
                  <a 
                    href="/community" 
                    style={{ color: "white", textDecoration: "underline", fontWeight: "600" }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Community Feed
                  </a>{" "}
                  where other animal lovers can see and interact with it!
                </div>

                <div style={{ display: "grid", gap: 24 }}>
                  {/* Post Title */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Post Title *</label>
                    <Input
                      value={postData.title}
                      onChange={(e) => setPostData({ ...postData, title: e.target.value })}
                      placeholder="Give your post a catchy title..."
                      style={{ fontSize: "16px" }}
                    />
                  </div>

                  {/* Post Content */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>What's happening in the animal world?</label>
                    <Textarea
                      value={postData.content}
                      onChange={(e) => setPostData({ ...postData, content: e.target.value })}
                      placeholder="Share your thoughts, experiences, or questions about animals..."
                      rows={4}
                    />
                  </div>

                  {/* Community Selection */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Community</label>
                    <select
                      value={postData.community}
                      onChange={(e) => setPostData({ ...postData, community: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        background: "var(--panel)",
                        color: "var(--text)"
                      }}
                    >
                      <option value="">Select a community</option>
                      <option value="General Animal Care">General Animal Care - Daily care & welfare</option>
                      <option value="Pet Photography">Pet Photography - Share & discuss pet photos</option>
                      <option value="Adoption Support">Adoption Support - Help adopting/fostering</option>
                      <option value="Rescue Stories">Rescue Stories - Share rescue experiences</option>
                      <option value="Wildlife Conservation">Wildlife Conservation - Wild animal protection</option>
                    </select>
                  </div>

                  {/* Topic Selection */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Topic</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {TOPICS.map(topic => (
                        <Chip
                          key={topic}
                          active={postData.topic === topic}
                          onClick={() => setPostData({ ...postData, topic: postData.topic === topic ? "" : topic })}
                          style={{ cursor: "pointer" }}
                        >
                          {topic}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Add Photos</label>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <Button variant="outline" onClick={() => document.getElementById('post-image-upload').click()}>
                        <Camera size={16}/> Add Photos
                      </Button>
                      <input
                        id="post-image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={handlePostImageUpload}
                      />
                    </div>
                    
                    {/* Image Previews */}
                    {postData.images.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                        {postData.images.map((image, index) => (
                          <div key={index} style={{ position: "relative" }}>
                            <img
                              src={image.preview}
                              alt={image.name}
                              style={{
                                width: "100%",
                                height: 120,
                                objectFit: "cover",
                                borderRadius: "8px"
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePostImage(index)}
                              style={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                background: "rgba(0,0,0,0.7)",
                                color: "white",
                                padding: "2px 6px",
                                minWidth: "auto"
                              }}
                            >
                              <X size={14}/>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post Preview */}
                  {(postData.title || postData.content) && (
                    <div style={{ 
                      padding: 16, 
                      border: "1px solid var(--border)", 
                      borderRadius: "8px",
                      background: "var(--panel)"
                    }}>
                      <h4 style={{ margin: "0 0 12px 0" }}>Post Preview</h4>
                      {postData.title && (
                        <div style={{ marginBottom: 8 }}>
                          <strong>Title:</strong> {postData.title}
                        </div>
                      )}
                      {postData.content && (
                        <div style={{ marginBottom: 8 }}>
                          <strong>Content:</strong> {postData.content}
                        </div>
                      )}
                      {postData.community && (
                        <div style={{ marginBottom: 8 }}>
                          <strong>Community:</strong> {postData.community}
                        </div>
                      )}
                      {postData.topic && (
                        <div style={{ marginBottom: 8 }}>
                          <strong>Topic:</strong> {postData.topic}
                        </div>
                      )}
                      {postData.images.length > 0 && (
                        <div>
                          <strong>Images:</strong> {postData.images.length} photo(s)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "flex-end" }}>
                  <Button variant="outline" onClick={() => {
                    setShowPostModal(false);
                    resetPostData();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePost} disabled={!postData.title.trim() || !postData.content.trim()}>
                    Create Post
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
} 