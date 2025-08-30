import React, { useMemo, useState, useEffect } from "react";
import { Card, Button, Input, Chip, Textarea } from "../components/ui.jsx";
import { Users, Camera, PawPrint, HeartHandshake, Search, Plus, MessageCircle, Heart, Share, TrendingUp, Clock, Star, X, Dog, Cat, Bird, Fish, Rabbit, Rat, Turtle, Snail, Bug, Bone, Egg, Panda, Squirrel, Worm, Shell, ArrowRight, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import { communityService } from "../services/communityService.js";
import { supabase } from "../lib/supabase.js";
import { Link } from "react-router-dom";

// Communities are now loaded from the database via communityService

const TOPICS = [
  "Animal Care", "Pet Pics", "Rescue Stories", "Wildlife", "Adoption", 
  "Volunteering", "Donations", "Education", "Events", "Tips & Advice"
];


export default function CommunityPage({ onOpenAuth }){
  const [q,setQ]=useState("");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [joinedCommunities, setJoinedCommunities] = useState(new Set());
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCommunityPostModal, setShowCommunityPostModal] = useState(false);
  const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
  const [createCommunityData, setCreateCommunityData] = useState({
    name: "",
    description: "",
    icon: "PawPrint"
  });
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postVotes, setPostVotes] = useState(new Map()); // postId -> voteType

  const [comments, setComments] = useState({}); // postId -> comments array
  const [commentsLoading, setCommentsLoading] = useState({}); // postId -> loading state
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [showComments, setShowComments] = useState(new Set()); // postId -> boolean
  const [viewingPost, setViewingPost] = useState(null); // postId -> post object for main view
  const [postData, setPostData] = useState({
    title: "",
    content: "",
    images: [],
    community: "",
    topic: ""
  });
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [postUserProfiles, setPostUserProfiles] = useState(new Map()); // userId -> profile data
  
  // Load user profile data from database (same as edit profile modal)
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('avatar_url, full_name')
          .eq('user_id', user.id)
          .single();
        
        if (!error && profileData) {
          setUserProfile(profileData);
          console.log('User profile loaded:', profileData);
        }
      } catch (err) {
        console.log('Could not fetch user profile:', err);
      }
    };
    
    loadUserProfile();
  }, [user]);
  
  // Load profile pictures for all post authors
  useEffect(() => {
    const loadPostUserProfiles = async () => {
      if (!posts.length) return;
      
      try {
        // Get unique user IDs from posts
        const userIds = [...new Set(posts.map(post => post.user_id))];
        
        // Fetch profiles for all post authors
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('user_id, avatar_url, full_name')
          .in('user_id', userIds);
        
        if (!error && profiles) {
          const profileMap = new Map();
          profiles.forEach(profile => {
            profileMap.set(profile.user_id, profile);
          });
          setPostUserProfiles(profileMap);
          console.log('Post user profiles loaded:', profileMap);
        }
      } catch (err) {
        console.log('Could not fetch post user profiles:', err);
      }
    };
    
    loadPostUserProfiles();
  }, [posts]);
  const filteredCommunities = useMemo(()=> communities.filter(c => c.name.toLowerCase().includes(q.toLowerCase())),[communities, q]);
  
  // Helper function to render profile picture for posts
  const renderPostProfilePicture = (post) => {
    const userProfile = postUserProfiles.get(post.user_id);
    const avatarUrl = userProfile?.avatar_url;
    
    // Check if the URL is complete and valid
    if (avatarUrl && avatarUrl.trim() !== "" && !avatarUrl.endsWith('/') && avatarUrl.includes('.')) {
      return (
        <img src={avatarUrl} alt="" style={{ height: 40, width: 40, borderRadius: 999, objectFit: "cover" }} />
      );
    }
    
    // Fallback to avatar placeholder with initials from database or user metadata
    const displayName = userProfile?.full_name || post.user?.user_metadata?.full_name || post.user?.email;
    const initial = displayName ? displayName[0]?.toUpperCase() : "U";
    
    return (
      <div style={{ height: 40, width: 40, borderRadius: 999, background: "var(--accent)", display: "grid", placeItems: "center", color: "white", fontSize: "16px", fontWeight: "600" }}>
        {initial}
      </div>
    );
  };
  
  // Helper function to render profile picture for post detail view
  const renderPostDetailProfilePicture = (post) => {
    const userProfile = postUserProfiles.get(post.user_id);
    const avatarUrl = userProfile?.avatar_url;
    
    // Check if the URL is complete and valid
    if (avatarUrl && avatarUrl.trim() !== "" && !avatarUrl.endsWith('/') && avatarUrl.includes('.')) {
      return (
        <img src={avatarUrl} alt="" style={{ height: 56, width: 56, borderRadius: "50%", objectFit: "cover" }} />
      );
    }
    
    // Fallback to avatar placeholder with initials from database or user metadata
    const displayName = userProfile?.full_name || post.user?.user_metadata?.full_name || post.user?.email;
    const initial = displayName ? displayName[0]?.toUpperCase() : "U";
    
    return (
      <div style={{ 
        height: 56, 
        width: 56, 
        borderRadius: "50%", 
        background: "var(--accent)", 
        display: "grid", 
        placeItems: "center", 
        color: "white", 
        fontSize: "20px", 
        fontWeight: "600",
        flexShrink: 0
      }}>
        {initial}
      </div>
    );
  };

  // Load communities and user memberships from database
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load communities with stats
        const { data: communitiesData, error: communitiesError } = await communityService.getCommunities();
        if (communitiesError) throw communitiesError;
        
        setCommunities(communitiesData || []);
        
        // Load user memberships if logged in
        if (user) {
          // Ensure user profile exists in the users table
          await communityService.ensureUserProfile(user.id, user);
          
          const { data: userCommunities, error: membershipsError } = await communityService.getUserCommunities(user.id);
          if (membershipsError) throw membershipsError;
          
          const joinedIds = new Set(userCommunities.map(m => m.community_id));
          setJoinedCommunities(joinedIds);
        }
      } catch (error) {
        console.error('Error loading community data:', error);
        
        // Check if it's a database setup issue
        if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
          console.error('Database schema not set up. Please run COMMUNITY_SCHEMA.sql in Supabase SQL Editor.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Initial posts fetch after communities are loaded
  useEffect(() => {
    if (!loading && communities.length > 0) {
      console.log('Initial posts fetch triggered');
      fetchPosts();
    }
  }, [loading, communities]);

  // Fetch posts when selected community changes or on initial load
  useEffect(() => {
    fetchPosts();
  }, [selectedCommunity]);

  const handleJoinCommunity = async (communityId) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      const { error } = await communityService.joinCommunity(user.id, communityId);
      if (error) throw error;
      
      // Update local state
      setJoinedCommunities(prev => new Set([...prev, communityId]));
      
      // Refresh communities to get updated counts
      const { data: communitiesData } = await communityService.getCommunities();
      if (communitiesData) {
        setCommunities(communitiesData);
      }
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community. Please try again.');
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    if (!user) return;

    try {
      const { error } = await communityService.leaveCommunity(user.id, communityId);
      if (error) throw error;
      
      // Update local state
      setJoinedCommunities(prev => {
        const newSet = new Set(prev);
        newSet.delete(communityId);
        return newSet;
      });
      
      // Refresh communities to get updated counts
      const { data: communitiesData } = await communityService.getCommunities();
      if (communitiesData) {
        setCommunities(communitiesData);
      }
    } catch (error) {
      console.error('Error leaving community:', error);
      alert('Failed to leave community. Please try again.');
    }
  };

  const handleCreatePost = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    // Here you would typically open a post creation modal
    alert("Post creation functionality coming soon!");
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

  const handleSubmitPost = async () => {
    if (!postData.content.trim()) {
      alert("Please write something to post!");
      return;
    }
    
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      let communityId = null;
      
      // If posting to a specific community, find the community ID
      if (postData.community) {
        communityId = communities.find(c => c.name === postData.community)?.id;
      }
      
      // Create the post
      const { error } = await communityService.createPost(user.id, communityId, postData);
      if (error) throw error;
      
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
      
      // Refresh communities to get updated active counts
      const { data: communitiesData } = await communityService.getCommunities();
      if (communitiesData) {
        setCommunities(communitiesData);
      }
      
      // Refresh posts to show the new post
      await fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Check if it's a database setup issue
      if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
        alert('Database not set up. Please run the COMMUNITY_SCHEMA.sql in your Supabase SQL Editor first.');
      } else {
        alert('Failed to create post. Please try again. Error: ' + error.message);
      }
    }
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

  // Function to open post modal
  const openPostModal = () => {
    console.log("Opening post modal");
    setShowPostModal(true);
  };

  // Function to open community-specific post modal
  const openCommunityPostModal = () => {
    console.log("Opening community post modal for:", selectedCommunity?.name);
    setShowCommunityPostModal(true);
    
    // Update active count when user interacts with community
    if (selectedCommunity && user && joinedCommunities.has(selectedCommunity.id)) {
      communityService.updateUserActivity(user.id, selectedCommunity.id);
    }
  };

  // Function to create a new community
  const handleCreateCommunity = async () => {
    if (!createCommunityData.name.trim() || !createCommunityData.description.trim()) {
      alert("Please fill in both name and description!");
      return;
    }

    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      // Generate a unique ID for the community
      const communityId = createCommunityData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Here you would typically save the community to your database
      // For now, we'll just show a success message
      alert(`Community "${createCommunityData.name}" created successfully!`);
      
      // Reset form data
      setCreateCommunityData({
        name: "",
        description: "",
        icon: "PawPrint"
      });
      
      setShowCreateCommunityModal(false);
      
      // Refresh communities list
      const { data: communitiesData } = await communityService.getCommunities();
      if (communitiesData) {
        setCommunities(communitiesData);
      }
    } catch (error) {
      console.error('Error creating community:', error);
      alert('Failed to create community. Please try again.');
    }
  };

  // Function to get current community counts
  const getCommunityCounts = (communityId) => {
    const community = communities.find(c => c.id === communityId);
    return community ? { members: community.members, active: community.active } : { members: 0, active: 0 };
  };

  // Function to fetch posts
  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      if (selectedCommunity) {
        // Fetch posts for specific community
        const { data: communityPosts, error } = await communityService.getCommunityPosts(selectedCommunity.id);
        if (error) throw error;
        setPosts(communityPosts || []);
      } else {
        // Fetch all posts for main feed
        const { data: allPosts, error } = await communityService.getAllPosts();
        if (error) throw error;
        setPosts(allPosts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Function to vote on a post
  const handlePostVote = async (postId, voteType) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      const { error } = await communityService.voteOnPost(user.id, postId, voteType);
      if (error) throw error;

      // Update local state
      setPostVotes(prev => new Map(prev).set(postId, voteType));
      
      // Refresh posts to get updated vote counts
      await fetchPosts();
    } catch (error) {
      console.error('Error voting on post:', error);
      alert('Failed to vote on post. Please try again.');
    }
  };

  // Function to open post detail view
  const openPostDetail = async (post) => {
    setViewingPost(post);
    
    // Load comments if not already loaded
    if (!comments[post.id]) {
      setCommentsLoading(prev => ({ ...prev, [post.id]: true }));
      try {
        const { data: postComments, error } = await communityService.getPostComments(post.id);
        if (error) throw error;
        setComments(prev => ({ ...prev, [post.id]: postComments || [] }));
      } catch (error) {
        console.error('Error fetching comments:', error);
        setComments(prev => ({ ...prev, [post.id]: [] }));
      } finally {
        setCommentsLoading(prev => ({ ...prev, [post.id]: false }));
      }
    }
  };

  // Function to create a comment
  const handleCreateComment = async (postId) => {
    if (!newComment.trim() || !postId) return;
    
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      const { error } = await communityService.createComment(
        user.id, 
        postId, 
        newComment, 
        replyingTo
      );
      
      if (error) throw error;

      // Refresh comments for this specific post
      const { data: postComments, error: fetchError } = await communityService.getPostComments(postId);
      if (!fetchError) {
        setComments(postComments || []);
      }

      setNewComment("");
      setReplyingTo(null);
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to create comment. Please try again.');
    }
  };

  // Function to toggle comments for a specific post
  const toggleComments = async (postId) => {
    if (!showComments.has(postId)) {
      // Show comments - fetch them if not already loaded
      if (!comments[postId]) {
        setCommentsLoading(prev => ({ ...prev, [postId]: true }));
        try {
          const { data: postComments, error } = await communityService.getPostComments(postId);
          if (!error) {
            setComments(prev => ({ ...prev, [postId]: postComments || [] }));
          }
        } catch (error) {
          console.error('Error fetching comments:', error);
        } finally {
          setCommentsLoading(prev => ({ ...prev, [postId]: false }));
        }
      }
    }
    setShowComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Function to vote on a comment
  const handleCommentVote = async (commentId, voteType, postId) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      const { error } = await communityService.voteOnComment(user.id, commentId, voteType);
      if (error) throw error;

      // Refresh comments for this specific post
      const { data: postComments, error: fetchError } = await communityService.getPostComments(postId);
      if (!fetchError) {
        setComments(prev => ({ ...prev, [postId]: postComments || [] }));
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
      alert('Failed to vote on comment. Please try again.');
    }
  };


  return (
    <div className="container" style={{ paddingTop: "0", marginTop: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, alignItems: "start" }}>
      {/* Sidebar - Communities List */}
      <aside style={{ position: "sticky", top: 16, height: "fit-content" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          <Card style={{ padding: 12, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Search size={16}/><span className="muted" style={{ fontSize: 14 }}>Search communities</span>
            </div>
            <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" />
          </Card>
          
          <Card style={{ padding: 12, width: "100%" }}>
            <div className="spread" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Communities</h3>
              <Button size="sm" onClick={() => setShowCreateCommunityModal(true)}><Plus size={16}/> Create</Button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "300px", overflowY: "auto" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                  <div style={{ animation: "spin 1s linear infinite", fontSize: "20px", marginBottom: "8px" }}>⟳</div>
                  Loading communities...
                </div>
              ) : communities.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                  <div style={{ fontSize: "14px", marginBottom: "8px" }}>⚠️ Database not set up</div>
                  <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
                    Run <code>COMMUNITY_SCHEMA.sql</code> in your Supabase SQL Editor to get started.
                  </div>
                </div>
              ) : (
                filteredCommunities.map(C=>(
                <div 
                  key={C.id} 
                  style={{ 
                    display: "flex", 
                    gap: 8, 
                    alignItems: "center", 
                    padding: 8, 
                    borderRadius: 8, 
                    border: "1px solid var(--border)", 
                    cursor: "pointer",
                    background: selectedCommunity?.id === C.id ? "var(--accent)" : "transparent",
                    color: selectedCommunity?.id === C.id ? "white" : "inherit"
                  }}
                  onClick={() => {
                    setSelectedCommunity(C);
                    // Update active count when viewing community
                    if (user && joinedCommunities.has(C.id)) {
                      communityService.updateUserActivity(user.id, C.id);
                    }
                  }}
                >
                  <div style={{ height: 32, width: 32, borderRadius: 8, background: "color-mix(in lab, var(--accent) 20%, transparent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    {(() => {
                      const IconComponent = C.icon_name === 'PawPrint' ? PawPrint :
                                           C.icon_name === 'Camera' ? Camera :
                                           C.icon_name === 'HeartHandshake' ? HeartHandshake :
                                           C.icon_name === 'Heart' ? Heart :
                                           C.icon_name === 'MessageCircle' ? MessageCircle :
                                           C.icon_name === 'Users' ? Users :
                                           C.icon_name === 'Dog' ? Dog :
                                           C.icon_name === 'Cat' ? Cat :
                                           C.icon_name === 'Bird' ? Bird :
                                           C.icon_name === 'Fish' ? Fish :
                                           C.icon_name === 'Turtle' ? Turtle :
                                           C.icon_name === 'Rabbit' ? Rabbit :
                                           C.icon_name === 'Rat' ? Rat :
                                           C.icon_name === 'Snail' ? Snail :
                                           C.icon_name === 'Bug' ? Bug :
                                           C.icon_name === 'Bone' ? Bone :
                                           C.icon_name === 'Egg' ? Egg :
                                           C.icon_name === 'Panda' ? Panda :
                                           C.icon_name === 'Squirrel' ? Squirrel :
                                           C.icon_name === 'Worm' ? Worm :
                                           C.icon_name === 'Shell' ? Shell :
                                           PawPrint; // Default fallback
                      return <IconComponent size={16}/>;
                    })()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{C.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{C.desc}</div>
                    <div className="muted" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                      <Users size={12}/> {getCommunityCounts(C.id).members} members · {getCommunityCounts(C.id).active} active
                    </div>
                  </div>
                  {joinedCommunities.has(C.id) ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      style={{ flexShrink: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveCommunity(C.id);
                      }}
                    >
                      Leave
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      style={{ flexShrink: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinCommunity(C.id);
                      }}
                    >
                      Join
                    </Button>
                  )}
                </div>
              ))
              )}
            </div>
          </Card>

          {/* Joined Communities Section */}
          {user && joinedCommunities.size > 0 && (
            <Card style={{ padding: 12, width: "100%" }}>
              <div className="spread" style={{ marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Joined Communities</h3>
                <span className="muted" style={{ fontSize: 12 }}>{joinedCommunities.size} joined</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "200px", overflowY: "auto" }}>
                {Array.from(joinedCommunities).map(communityId => {
                  const community = communities.find(c => c.id === communityId);
                  if (!community) return null;
                  
                  return (
                    <div 
                      key={community.id} 
                      style={{ 
                        display: "flex", 
                        gap: 8, 
                        alignItems: "center", 
                        padding: 8, 
                        borderRadius: 8, 
                        border: "1px solid var(--border)", 
                        cursor: "pointer",
                        background: selectedCommunity?.id === community.id ? "var(--accent)" : "var(--panel)",
                        color: selectedCommunity?.id === community.id ? "white" : "inherit"
                      }}
                      onClick={() => setSelectedCommunity(community)}
                    >
                      <div style={{ height: 24, width: 24, borderRadius: 6, background: "color-mix(in lab, var(--accent) 20%, transparent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                                              {(() => {
                        const IconComponent = community.icon_name === 'PawPrint' ? PawPrint :
                                             community.icon_name === 'Camera' ? Camera :
                                             community.icon_name === 'HeartHandshake' ? HeartHandshake :
                                             community.icon_name === 'Heart' ? Heart :
                                             community.icon_name === 'MessageCircle' ? MessageCircle :
                                             community.icon_name === 'Users' ? Users :
                                             community.icon_name === 'Dog' ? Dog :
                                             community.icon_name === 'Cat' ? Cat :
                                             community.icon_name === 'Bird' ? Bird :
                                             community.icon_name === 'Fish' ? Fish :
                                             community.icon_name === 'Turtle' ? Turtle :
                                             community.icon_name === 'Rabbit' ? Rabbit :
                                             community.icon_name === 'Rat' ? Rat :
                                             community.icon_name === 'Snail' ? Snail :
                                             community.icon_name === 'Bug' ? Bug :
                                             community.icon_name === 'Bone' ? Bone :
                                             community.icon_name === 'Egg' ? Egg :
                                             community.icon_name === 'Panda' ? Panda :
                                             community.icon_name === 'Squirrel' ? Squirrel :
                                             community.icon_name === 'Worm' ? Worm :
                                             community.icon_name === 'Shell' ? Shell :
                                             PawPrint; // Default fallback
                        return <IconComponent size={12}/>;
                      })()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{community.name}</div>
                        <div className="muted" style={{ fontSize: 11 }}>
                          {getCommunityCounts(community.id).members} members
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card style={{ padding: 12, width: "100%" }}>
            <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: .6, marginBottom: 8 }}>Feed Filter</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  padding: "8px 12px", 
                  borderRadius: "8px", 
                  border: "1px solid var(--border)", 
                  background: "var(--panel)", 
                  color: "var(--text)", 
                  cursor: "pointer",
                  fontSize: "14px",
                  textAlign: "left",
                  width: "100%"
                }}
              >
                <TrendingUp size={16}/> Trending
              </button>
              <button 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  padding: "8px 12px", 
                  borderRadius: "8px", 
                  border: "1px solid var(--border)", 
                  background: "var(--panel)", 
                  color: "var(--text)", 
                  cursor: "pointer",
                  fontSize: "14px",
                  textAlign: "left",
                  width: "100%"
                }}
              >
                <Clock size={16}/> Recent
              </button>
              <button 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  padding: "8px 12px", 
                  borderRadius: "8px", 
                  border: "1px solid var(--border)", 
                  background: "var(--panel)", 
                  color: "var(--text)", 
                  cursor: "pointer",
                  fontSize: "14px",
                  textAlign: "left",
                  width: "100%"
                }}
              >
                <Star size={16}/> Featured
              </button>
            </div>
          </Card>

          <Card style={{ padding: 12, width: "100%" }}>
            <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: .6, marginBottom: 8 }}>Topics</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <Chip><PawPrint size={14}/> Animal Care</Chip>
              <Chip><Camera size={14}/> Pet Pics</Chip>
              <Chip><HeartHandshake size={14}/> Rescue Stories</Chip>
            </div>
          </Card>
        </div>
      </aside>

      {/* Main Content - Community Feed */}
      <section style={{ display:"grid", gap:16 }}>
        {loading ? (
          <Card style={{ padding: 40, textAlign: "center" }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTop: "3px solid var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px auto" }}></div>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "24px" }}>Loading Communities...</h3>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "16px" }}>Please wait while we load the latest community data.</p>
            </div>
          </Card>
        ) : viewingPost ? (
          <>
            {/* Post Detail View */}
            <div style={{ marginBottom: 24 }}>
              <Button 
                variant="ghost" 
                onClick={() => setViewingPost(null)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  marginBottom: 16,
                  fontSize: "16px",
                  padding: "12px 16px"
                }}
              >
                ← Back to All Posts
              </Button>
            </div>

            {/* Full Post Content */}
            <Card style={{ 
              padding: 0, 
              marginBottom: 24, 
              border: "1px solid var(--border)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              background: "var(--panel)"
            }}>
              {/* Post Header */}
              <div style={{ 
                display: "flex", 
                gap: 16, 
                marginBottom: 24,
                alignItems: "flex-start",
                padding: "24px 24px 0 24px"
              }}>
                {renderPostDetailProfilePicture(viewingPost)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: "600", 
                    fontSize: "16px", 
                    marginBottom: "4px",
                    color: "var(--text)"
                  }}>
                    <Link 
                      to={`/profile/${viewingPost.user_id}`}
                      style={{ 
                        color: "inherit", 
                        textDecoration: "none",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => e.target.style.color = "var(--accent)"}
                      onMouseLeave={(e) => e.target.style.color = "inherit"}
                    >
                      {viewingPost.user?.user_metadata?.full_name || viewingPost.user?.email || "Anonymous User"}
                    </Link>
                  </div>
                  <div style={{ 
                    fontSize: "14px",
                    color: "var(--muted)"
                  }}>
                    {new Date(viewingPost.created_at).toLocaleDateString()} • {new Date(viewingPost.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div style={{ marginBottom: 32, padding: "0 24px" }}>
                {viewingPost.title && (
                  <h1 style={{ 
                    margin: "0 0 16px 0", 
                    fontSize: "28px", 
                    fontWeight: "700", 
                    lineHeight: 1.3,
                    color: "var(--text)"
                  }}>
                    {viewingPost.title}
                  </h1>
                )}

                <div style={{ 
                  fontSize: "18px", 
                  lineHeight: 1.6,
                  color: "var(--text)",
                  marginBottom: "20px"
                }}>
                  {viewingPost.content}
                </div>

                {/* Post Metadata */}
                <div style={{ 
                  display: "flex", 
                  gap: 12, 
                  alignItems: "center",
                  flexWrap: "wrap"
                }}>
                  {viewingPost.topic && (
                    <Chip 
                      active 
                      style={{ 
                        fontSize: "14px", 
                        padding: "6px 12px",
                        background: "var(--accent)",
                        color: "white",
                        border: "none"
                      }}
                    >
                      {viewingPost.topic}
                    </Chip>
                  )}
                  
                  {viewingPost.community && (
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "6px",
                      fontSize: "14px",
                      color: "var(--muted)",
                      padding: "6px 12px",
                      background: "var(--panel)",
                      borderRadius: "20px",
                      border: "1px solid var(--border)"
                    }}>
                      <span>🏷️</span>
                      <span>{viewingPost.community.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Interaction Bar */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 16, 
                padding: "16px 24px",
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)"
              }}>
                {/* Voting */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px"
                }}>
                  <button
                    onClick={() => handlePostVote(viewingPost.id, 1)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: postVotes.get(viewingPost.id) === 1 ? "var(--accent)" : "var(--muted)",
                      padding: "8px",
                      borderRadius: "6px",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px"
                    }}
                  >
                    <ChevronUp size={18}/>
                  </button>
                  <span style={{ 
                    fontWeight: "600", 
                    fontSize: "16px",
                    color: "var(--text)",
                    minWidth: "32px",
                    textAlign: "center"
                  }}>
                    {(viewingPost.upvotes || 0) - (viewingPost.downvotes || 0)}
                  </span>
                  <button
                    onClick={() => handlePostVote(viewingPost.id, -1)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: postVotes.get(viewingPost.id) === -1 ? "var(--accent)" : "var(--muted)",
                      padding: "8px",
                      borderRadius: "6px",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px"
                    }}
                  >
                    <ChevronDown size={18}/>
                  </button>
                </div>

                {/* Comments Count */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  color: "var(--muted)"
                }}>
                  <MessageCircle size={18}/>
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    {comments[viewingPost.id]?.length || 0} comments
                  </span>
                </div>

                {/* Share Button */}
                <div style={{ marginLeft: "auto" }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const postUrl = `${window.location.origin}/post/${viewingPost.id}`;
                      if (navigator.share) {
                        navigator.share({
                          title: viewingPost.title || 'Check out this post',
                          text: viewingPost.content.substring(0, 100) + '...',
                          url: postUrl
                        });
                      } else {
                        navigator.clipboard.writeText(postUrl);
                        alert('Post link copied to clipboard!');
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      padding: "8px 16px",
                      borderRadius: "8px"
                    }}
                  >
                    <Share size={16}/>
                    Share
                  </Button>
                </div>
              </div>
            </Card>

            {/* Comments Section */}
            <Card style={{ 
              padding: 0, 
              border: "none",
              boxShadow: "none",
              background: "transparent"
            }}>
              {/* Add Comment */}
              <div style={{ 
                marginBottom: 32,
                padding: "24px",
                background: "var(--panel)",
                borderRadius: "12px",
                border: "1px solid var(--border)"
              }}>
                <h3 style={{ 
                  margin: "0 0 20px 0", 
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "var(--text)"
                }}>
                  Add a comment
                </h3>
                
                <Textarea
                  placeholder="What are your thoughts on this post?"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  style={{ 
                    marginBottom: 16, 
                    fontSize: "16px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "12px 16px"
                  }}
                />
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  {replyingTo && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setReplyingTo(null)}
                      style={{ padding: "8px 16px" }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleCreateComment(viewingPost.id)}
                    disabled={!newComment.trim()}
                    size="sm"
                    style={{ 
                      padding: "8px 20px",
                      background: "var(--accent)",
                      color: "white",
                      border: "none"
                    }}
                  >
                    Post Comment
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              {commentsLoading[viewingPost.id] ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "40px", 
                  color: "var(--muted)",
                  background: "var(--panel)",
                  borderRadius: "12px",
                  border: "1px solid var(--border)"
                }}>
                  <div style={{ animation: "spin 1s linear infinite", fontSize: "24px", marginBottom: "16px" }}>⟳</div>
                  Loading comments...
                </div>
              ) : (!comments[viewingPost.id] || comments[viewingPost.id].length === 0) ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "40px", 
                  color: "var(--muted)",
                  background: "var(--panel)",
                  borderRadius: "12px",
                  border: "1px solid var(--border)"
                }}>
                  <MessageCircle size={32} style={{ marginBottom: "16px", opacity: 0.5 }}/>
                  <p style={{ margin: 0, fontSize: "16px" }}>No comments yet</p>
                  <p style={{ margin: "8px 0 0 0", fontSize: "14px", opacity: 0.7 }}>Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {comments[viewingPost.id].map((comment) => (
                    <div key={comment.id} style={{ 
                      padding: "20px", 
                      border: "1px solid var(--border)", 
                      borderRadius: "12px",
                      background: "var(--panel)"
                    }}>
                      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                        <div style={{ 
                          height: 36, 
                          width: 36, 
                          borderRadius: "50%", 
                          background: "var(--accent)", 
                          display: "grid", 
                          placeItems: "center", 
                          color: "white", 
                          fontSize: "14px", 
                          fontWeight: "600",
                          flexShrink: 0
                        }}>
                          {comment.user?.user_metadata?.full_name?.[0] || comment.user?.email?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: "600", 
                            fontSize: "14px",
                            color: "var(--text)"
                          }}>
                            <Link 
                              to={`/profile/${comment.user_id}`}
                              style={{ 
                                color: "inherit", 
                                textDecoration: "none",
                                cursor: "pointer"
                              }}
                              onMouseEnter={(e) => e.target.style.color = "var(--accent)"}
                              onMouseLeave={(e) => e.target.style.color = "inherit"}
                            >
                              {comment.user?.user_metadata?.full_name || comment.user?.email || "Anonymous User"}
                            </Link>
                          </div>
                          <div style={{ 
                            fontSize: "12px",
                            color: "var(--muted)"
                          }}>
                            {new Date(comment.created_at).toLocaleDateString()} • {new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ 
                        fontSize: "16px", 
                        lineHeight: 1.5, 
                        marginBottom: 16,
                        color: "var(--text)"
                      }}>
                        {comment.content}
                      </div>

                      {/* Comment Actions */}
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 16,
                        paddingTop: 12,
                        borderTop: "1px solid var(--border)"
                      }}>
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "6px"
                        }}>
                          <button
                            onClick={() => handleCommentVote(comment.id, 1, viewingPost.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--muted)",
                              padding: "6px",
                              borderRadius: "4px",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "28px",
                              height: "28px"
                            }}
                          >
                            <ChevronUp size={14}/>
                          </button>
                          <span style={{ 
                            fontSize: "14px", 
                            fontWeight: "500",
                            color: "var(--text)",
                            minWidth: "20px",
                            textAlign: "center"
                          }}>
                            {(comment.upvotes || 0) - (comment.downvotes || 0)}
                          </span>
                          <button
                            onClick={() => handleCommentVote(comment.id, -1, viewingPost.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--muted)",
                              padding: "6px",
                              borderRadius: "4px",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "28px",
                              height: "28px"
                            }}
                          >
                            <ChevronDown size={14}/>
                          </button>
                        </div>
                        
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--accent)",
                            fontSize: "13px",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            transition: "all 0.2s ease",
                            fontWeight: "500"
                          }}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        ) : selectedCommunity ? (
          <>
            {/* Community Header */}
            <Card style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <div style={{ height: 64, width: 64, borderRadius: 16, background: "color-mix(in lab, var(--accent) 20%, transparent)", display: "grid", placeItems: "center" }}>
                  {(() => {
                    const IconComponent = selectedCommunity.icon_name === 'PawPrint' ? PawPrint :
                                         selectedCommunity.icon_name === 'Camera' ? Camera :
                                         selectedCommunity.icon_name === 'HeartHandshake' ? HeartHandshake :
                                         selectedCommunity.icon_name === 'Heart' ? Heart :
                                         selectedCommunity.icon_name === 'MessageCircle' ? MessageCircle :
                                         selectedCommunity.icon_name === 'Users' ? Users :
                                         selectedCommunity.icon_name === 'Dog' ? Dog :
                                         selectedCommunity.icon_name === 'Cat' ? Cat :
                                         selectedCommunity.icon_name === 'Bird' ? Bird :
                                         selectedCommunity.icon_name === 'Fish' ? Fish :
                                         selectedCommunity.icon_name === 'Turtle' ? Turtle :
                                         selectedCommunity.icon_name === 'Rabbit' ? Rabbit :
                                         selectedCommunity.icon_name === 'Rat' ? Rat :
                                         selectedCommunity.icon_name === 'Snail' ? Snail :
                                         selectedCommunity.icon_name === 'Bug' ? Bug :
                                         selectedCommunity.icon_name === 'Bone' ? Bone :
                                         selectedCommunity.icon_name === 'Egg' ? Egg :
                                         selectedCommunity.icon_name === 'Panda' ? Panda :
                                         selectedCommunity.icon_name === 'Squirrel' ? Squirrel :
                                         selectedCommunity.icon_name === 'Worm' ? Worm :
                                         selectedCommunity.icon_name === 'Shell' ? Shell :
                                         PawPrint; // Default fallback
                    return <IconComponent size={32} color="var(--accent)" />;
                  })()}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 8px 0" }}>{selectedCommunity.name}</h2>
                  <p style={{ margin: "0 0 8px 0", color: "var(--muted)" }}>{selectedCommunity.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 14 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Users size={16}/> {getCommunityCounts(selectedCommunity.id).members} members
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={16}/> {getCommunityCounts(selectedCommunity.id).active} active now
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Button variant="outline" onClick={fetchPosts} disabled={postsLoading}>
                    <span style={{ fontSize: "18px", marginRight: "4px" }}>{postsLoading ? "⟳" : "⟳"}</span> Refresh
                  </Button>
                  {joinedCommunities.has(selectedCommunity.id) ? (
                    <Button variant="outline" onClick={() => handleLeaveCommunity(selectedCommunity.id)}>
                      Leave Community
                    </Button>
                  ) : (
                    <Button onClick={() => handleJoinCommunity(selectedCommunity.id)}>
                      Join Community
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setSelectedCommunity(null)}>
                    ← Back to All
                  </Button>
                </div>
              </div>
            </Card>

            {/* Create Post Card - Only show if joined */}
            {joinedCommunities.has(selectedCommunity.id) && (
              <Card style={{ padding: 16, cursor: "pointer" }} onClick={openCommunityPostModal}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                  {(() => {
                    // Get profile picture from database (same as edit profile modal)
                    const avatarUrl = userProfile?.avatar_url;
                    
                    // Check if the URL is complete and valid
                    if (avatarUrl && avatarUrl.trim() !== "" && !avatarUrl.endsWith('/') && avatarUrl.includes('.')) {
                      return (
                        <img src={avatarUrl} alt="" style={{ height: 40, width: 40, borderRadius: 999, objectFit: "cover" }} />
                      );
                    }
                    
                    // Fallback to avatar placeholder with initials from database or user metadata
                    const displayName = userProfile?.full_name || user?.user_metadata?.full_name || user?.email;
                    const initial = displayName ? displayName[0]?.toUpperCase() : "U";
                    
                    return (
                      <div style={{ height: 40, width: 40, borderRadius: 999, background: "var(--accent)", display: "grid", placeItems: "center", color: "white", fontSize: "16px", fontWeight: "600" }}>
                        {initial}
                      </div>
                    );
                  })()}
                  <Input 
                    placeholder={`What's happening in ${selectedCommunity.name}?`} 
                    style={{ flex: 1, cursor: "pointer" }}
                    readOnly
                  />
                </div>
                <div className="muted" style={{ display: "flex", gap: 16, fontSize: 14 }}>
                  <span style={{ cursor: "pointer" }}><Camera size={16}/> Photo/Video</span>
                  <span style={{ cursor: "pointer" }}><MessageCircle size={16}/> Poll</span>
                  <span style={{ cursor: "pointer" }}><Users size={16}/> Tag Community</span>
                </div>
              </Card>
            )}

            {/* Community Posts Feed */}
            {postsLoading ? (
              <Card style={{ padding: 40, textAlign: "center" }}>
                <div style={{ animation: "spin 1s linear infinite", fontSize: "32px", marginBottom: "16px" }}>⟳</div>
                <p style={{ margin: 0, color: "var(--muted)" }}>Loading posts...</p>
              </Card>
            ) : posts.length === 0 ? (
              <Card style={{ padding: 40, textAlign: "center" }}>
                <div style={{ marginBottom: 24 }}>
                  <PawPrint size={64} style={{ color: "var(--muted)", marginBottom: 16 }} />
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "24px" }}>No posts yet</h3>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "16px", lineHeight: 1.5 }}>
                    Be the first to share something in {selectedCommunity.name}! 
                    <br />
                    {joinedCommunities.has(selectedCommunity.id) 
                      ? "Create a post to get the conversation started."
                      : "Join the community to create your first post!"
                    }
                  </p>
                </div>
                
                {joinedCommunities.has(selectedCommunity.id) ? (
                  <Button size="lg" onClick={openCommunityPostModal}>
                    <Plus size={20}/> Create First Post
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => handleJoinCommunity(selectedCommunity.id)}>
                    <Users size={20}/> Join to Post
                  </Button>
                )}
              </Card>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {posts.map((post) => (
                  <Card key={post.id} style={{ padding: 16 }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                      {renderPostProfilePicture(post)}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "14px" }}>
                          <Link 
                            to={`/profile/${post.user_id}`}
                            style={{ 
                              color: "inherit", 
                              textDecoration: "none",
                              cursor: "pointer"
                            }}
                            onMouseEnter={(e) => e.target.style.color = "var(--accent)"}
                            onMouseLeave={(e) => e.target.style.color = "inherit"}
                          >
                            {post.user?.user_metadata?.full_name || post.user?.email || "Anonymous User"}
                          </Link>
                        </div>
                        <div className="muted" style={{ fontSize: "12px" }}>
                          {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Post Title */}
                    {post.title && (
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
                        {post.title}
                      </h3>
                    )}
                    
                    <div style={{ marginBottom: 12, fontSize: "16px", lineHeight: 1.5 }}>
                      {post.content}
                    </div>
                    
                    {post.topic && (
                      <div style={{ marginBottom: 12 }}>
                        <Chip active style={{ fontSize: "12px" }}>{post.topic}</Chip>
                      </div>
                    )}

                    {/* Voting and Interaction Bar */}
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 16, 
                      marginTop: 16, 
                      paddingTop: 16, 
                      borderTop: "1px solid var(--border)" 
                    }}>
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
                          fontSize: "14px",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.2s ease",
                          height: "36px"
                        }}
                      >
                        <MessageCircle size={16}/> {showComments.has(post.id) ? "Hide Comments" : "Comment"}
                      </button>

                      {/* View Post */}
                      <div style={{ marginLeft: "auto" }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPostDetail(post);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "14px",
                            padding: "8px 12px",
                            height: "36px"
                          }}
                        >
                          View Post
                          <ArrowRight size={14}/>
                        </Button>
                      </div>
                    </div>

                    {/* Inline Comments Section */}
                    {showComments.has(post.id) && (
                      <div style={{ 
                        marginTop: 16, 
                        paddingTop: 16, 
                        borderTop: "1px solid var(--border)" 
                      }}>
                        {/* Add Comment */}
                        <div style={{ marginBottom: 16 }}>
                          <Textarea
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={2}
                            style={{ marginBottom: 8 }}
                          />
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <Button 
                              size="sm" 
                              onClick={() => handleCreateComment(post.id)}
                              disabled={!newComment.trim()}
                            >
                              Post Comment
                            </Button>
                          </div>
                        </div>

                        {/* Comments List */}
                        {commentsLoading[post.id] ? (
                          <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                            <div style={{ animation: "spin 1s linear infinite", fontSize: "16px" }}>⟳</div>
                            Loading comments...
                          </div>
                        ) : (!comments[post.id] || comments[post.id].length === 0) ? (
                          <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                            <p style={{ margin: 0, fontSize: "14px" }}>No comments yet. Be the first to comment!</p>
                          </div>
                        ) : (
                          <div style={{ display: "grid", gap: 12 }}>
                            {comments[post.id].map((comment) => (
                              <div key={comment.id} style={{ 
                                padding: "12px", 
                                border: "1px solid var(--border)", 
                                borderRadius: "6px",
                                background: "var(--bg)"
                              }}>
                                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                  <div style={{ height: 24, width: 24, borderRadius: 999, background: "var(--accent)", display: "grid", placeItems: "center", color: "white", fontSize: "12px", fontWeight: "600" }}>
                                    {comment.user?.user_metadata?.full_name?.[0] || comment.user?.email?.[0]?.toUpperCase() || "U"}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: "12px" }}>
                                      {comment.user?.user_metadata?.full_name || comment.user?.email || "Anonymous User"}
                                    </div>
                                    <div className="muted" style={{ fontSize: "10px" }}>
                                      {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                                
                                <div style={{ fontSize: "14px", lineHeight: 1.4, marginBottom: 8 }}>
                                  {comment.content}
                                </div>

                                {/* Comment Voting */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <button
                                    onClick={() => handleCommentVote(comment.id, 1, post.id)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: "var(--muted)",
                                      fontSize: "12px",
                                      padding: "2px",
                                      borderRadius: "2px",
                                      transition: "all 0.2s ease"
                                    }}
                                  >
                                    ▲
                                  </button>
                                  <span style={{ fontSize: "12px", fontWeight: "600" }}>
                                    {(comment.upvotes || 0) - (comment.downvotes || 0)}
                                  </span>
                                  <button
                                    onClick={() => handleCommentVote(comment.id, -1, post.id)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: "var(--muted)",
                                      fontSize: "12px",
                                      padding: "2px",
                                      borderRadius: "2px",
                                      transition: "all 0.2s ease"
                                    }}
                                  >
                                    ▼
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
        <div className="spread">
          <h2 style={{ margin:0 }}>Community Feed</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button variant="outline" onClick={fetchPosts} disabled={postsLoading}>
              <span style={{ fontSize: "18px", marginRight: "4px" }}>{postsLoading ? "⟳" : "⟳"}</span> Refresh
            </Button>
            {user ? (
              <Button onClick={openPostModal}><Plus size={16}/> Create Post</Button>
            ) : (
              <Button onClick={onOpenAuth}><Plus size={16}/> Login to Post</Button>
            )}
          </div>
        </div>

        {/* Create Post Card */}
        {user ? (
          <Card style={{ padding: 16, cursor: "pointer" }} onClick={openPostModal}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
              {(() => {
                // Get profile picture from database (same as edit profile modal)
                const avatarUrl = userProfile?.avatar_url;
                
                // Check if the URL is complete and valid
                if (avatarUrl && avatarUrl.trim() !== "" && !avatarUrl.endsWith('/') && avatarUrl.includes('.')) {
                  return (
                    <img src={avatarUrl} alt="" style={{ height: 40, width: 40, borderRadius: 999, objectFit: "cover" }} />
                  );
                }
                
                // Fallback to avatar placeholder with initials from database or user metadata
                const displayName = userProfile?.full_name || user?.user_metadata?.full_name || user?.email;
                const initial = displayName ? displayName[0]?.toUpperCase() : "U";
                
                return (
                  <div style={{ height: 40, width: 40, borderRadius: 999, background: "var(--accent)", display: "grid", placeItems: "center", color: "white", fontSize: "16px", fontWeight: "600" }}>
                    {initial}
                  </div>
                );
              })()}
              <div style={{ flex: 1, cursor: "pointer" }}>
                <Input 
                  placeholder="What's happening in the animal world?" 
                  style={{ cursor: "pointer" }}
                  readOnly
                />
              </div>
            </div>
            <div className="muted" style={{ display: "flex", gap: 16, fontSize: "14" }}>
              <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Camera size={16}/> Photo/Video</span>
              <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><MessageCircle size={16}/> Poll</span>
              <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Users size={16}/> Tag Community</span>
            </div>
          </Card>
        ) : (
          <Card style={{ padding: 16, cursor: "pointer" }} onClick={onOpenAuth}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
              <div style={{ height: 40, width: 40, borderRadius: 999, background: "var(--muted)", display: "grid", placeItems: "center", color: "var(--muted-foreground)", fontSize: "16px", fontWeight: "600" }}>
                ?
              </div>
              <div style={{ flex: 1, cursor: "pointer" }}>
                <Input 
                  placeholder="Login to post..." 
                  style={{ cursor: "pointer" }}
                  readOnly
                />
              </div>
            </div>
            <div className="muted" style={{ display: "flex", gap: 16, fontSize: "14" }}>
              <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Camera size={16}/> Photo/Video</span>
              <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><MessageCircle size={16}/> Poll</span>
              <span style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Users size={16}/> Tag Community</span>
            </div>
          </Card>
        )}

            {/* Posts Feed */}
            {postsLoading ? (
              <Card style={{ padding: 40, textAlign: "center" }}>
                <div style={{ animation: "spin 1s linear infinite", fontSize: "32px", marginBottom: "16px" }}>⟳</div>
                <p style={{ margin: 0, color: "var(--muted)" }}>Loading posts...</p>
              </Card>
            ) : posts.length === 0 ? (
              <Card style={{ padding: 40, textAlign: "center" }}>
                <div style={{ marginBottom: 24 }}>
                  <PawPrint size={64} style={{ color: "var(--muted)", marginBottom: "16" }} />
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "24px" }}>No posts yet</h3>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "16px", lineHeight: 1.5 }}>
                    Be the first to share something amazing in the animal world! 
                    <br />
                    Share your rescue stories, pet photos, or ask questions about animal care.
                  </p>
                </div>
                
                {user ? (
                                      <Button size="lg" style={{ fontSize: "16px", padding: "12px 24px" }} onClick={openPostModal}>
                      <Plus size={20}/> Create Your First Post
                    </Button>
                  ) : (
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                      <Button size="lg" variant="outline" style={{ fontSize: "16px", padding: "12px 24px" }} onClick={onOpenAuth}>
                        <Users size={20}/> Sign Up to Post
                      </Button>
                      <Button size="lg" style={{ fontSize: "16px", padding: "12px 24px" }} onClick={onOpenAuth}>
                        <PawPrint size={20}/> Log In to Post
                      </Button>
                    </div>
                  )}
                </Card>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {posts.map((post) => (
                    <Card key={post.id} style={{ padding: 16 }}>
                      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                        {renderPostProfilePicture(post)}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "14px" }}>
                          <Link 
                            to={`/profile/${post.user_id}`}
                            style={{ 
                              color: "inherit", 
                              textDecoration: "none",
                              cursor: "pointer"
                            }}
                            onMouseEnter={(e) => e.target.style.color = "var(--accent)"}
                            onMouseLeave={(e) => e.target.style.color = "inherit"}
                          >
                            {post.user?.user_metadata?.full_name || post.user?.email || "Anonymous User"}
                          </Link>
                        </div>
                        <div className="muted" style={{ fontSize: "12px" }}>
                          {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Post Title */}
                    {post.title && (
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
                        {post.title}
                      </h3>
                    )}
                    
                    <div style={{ marginBottom: 12, fontSize: "16px", lineHeight: 1.5 }}>
                      {post.content}
                    </div>
                    
                    {post.topic && (
                      <div style={{ marginBottom: 12 }}>
                        <Chip active style={{ fontSize: "12px" }}>{post.topic}</Chip>
                      </div>
                    )}
                    
                    {post.community && (
                      <div style={{ marginBottom: 12 }}>
                        <span className="muted" style={{ fontSize: "12px" }}>
                          Posted in: <strong>{post.community.name}</strong>
                        </span>
                      </div>
                    )}

                    {/* Voting and Interaction Bar */}
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 16, 
                      marginTop: 16, 
                      paddingTop: 16, 
                      borderTop: "1px solid var(--border)" 
                    }}>
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
                          fontSize: "14px",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.2s ease",
                          height: "36px"
                        }}
                      >
                        <MessageCircle size={16}/> {showComments.has(post.id) ? "Hide Comments" : "Comment"}
                      </button>

                      {/* View Post */}
                      <div style={{ marginLeft: "auto" }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPostDetail(post);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "14px",
                            padding: "8px 12px",
                            height: "36px"
                          }}
                        >
                          View Post
                          <ArrowRight size={14}/>
                        </Button>
                      </div>
                    </div>

                    {/* Inline Comments Section */}
                    {showComments.has(post.id) && (
                      <div style={{ 
                        marginTop: 16, 
                        paddingTop: 16, 
                        borderTop: "1px solid var(--border)" 
                      }}>
                        {/* Add Comment */}
                        <div style={{ marginBottom: 16 }}>
                          <Textarea
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={2}
                            style={{ marginBottom: 8 }}
                          />
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <Button 
                              size="sm" 
                              onClick={() => handleCreateComment(post.id)}
                              disabled={!newComment.trim()}
                            >
                              Post Comment
                            </Button>
                          </div>
                        </div>

                        {/* Comments List */}
                        {commentsLoading[post.id] ? (
                          <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                            <div style={{ animation: "spin 1s linear infinite", fontSize: "16px" }}>⟳</div>
                            Loading comments...
                          </div>
                        ) : (!comments[post.id] || comments[post.id].length === 0) ? (
                          <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                            <p style={{ margin: 0, fontSize: "14px" }}>No comments yet. Be the first to comment!</p>
                          </div>
                        ) : (
                          <div style={{ display: "grid", gap: 12 }}>
                            {comments[post.id].map((comment) => (
                              <div key={comment.id} style={{ 
                                padding: "12px", 
                                border: "1px solid var(--border)", 
                                borderRadius: "6px",
                                background: "var(--bg)"
                              }}>
                                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                  <div style={{ height: 24, width: 24, borderRadius: 999, background: "var(--accent)", display: "grid", placeItems: "center", color: "white", fontSize: "12px", fontWeight: "600" }}>
                                    {comment.user?.user_metadata?.full_name?.[0] || comment.user?.email?.[0]?.toUpperCase() || "U"}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: "12px" }}>
                                      {comment.user?.user_metadata?.full_name || comment.user?.email || "Anonymous User"}
                                    </div>
                                    <div className="muted" style={{ fontSize: "10px" }}>
                                      {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                                
                                <div style={{ fontSize: "14px", lineHeight: 1.4, marginBottom: 8 }}>
                                  {comment.content}
                                </div>

                                {/* Comment Voting */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <button
                                    onClick={() => handleCommentVote(comment.id, 1, post.id)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: "var(--muted)",
                                      fontSize: "12px",
                                      padding: "2px",
                                      borderRadius: "2px",
                                      transition: "all 0.2s ease"
                                    }}
                                  >
                                    ▲
                                  </button>
                                  <span style={{ fontSize: "12px", fontWeight: "600" }}>
                                    {(comment.upvotes || 0) - (comment.downvotes || 0)}
                                  </span>
                                  <button
                                    onClick={() => handleCommentVote(comment.id, -1, post.id)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: "var(--muted)",
                                      fontSize: "12px",
                                      padding: "2px",
                                      borderRadius: "2px",
                                      transition: "all 0.2s ease"
                                    }}
                                  >
                                    ▼
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999999,
              padding: 16
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPostModal(false);
                resetPostData();
              }
            }}
          >
            <Card style={{
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              background: "var(--panel)",
              color: "var(--text)"
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
                  <strong>💡 Tip:</strong> Your post will appear in the Community Feed where other animal lovers can see and interact with it!
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

                  {/* Community Selection - Always show, with helpful message if no communities joined */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Tag Community (Optional)</label>
                    {joinedCommunities.size > 0 ? (
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
                        <option value="">No community tag</option>
                        {Array.from(joinedCommunities).map(communityId => {
                          const community = communities.find(c => c.id === communityId);
                          return community ? (
                            <option key={community.id} value={community.name}>
                              {community.name} - {community.description}
                            </option>
                          ) : null;
                        })}
                      </select>
                    ) : (
                      <div style={{
                        padding: "12px",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        background: "var(--panel)",
                        color: "var(--muted)",
                        textAlign: "center",
                        fontSize: "14px"
                      }}>
                        <Users size={16} style={{ marginRight: "8px", verticalAlign: "middle" }} />
                        Join communities to tag them in your posts
                      </div>
                    )}
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
                      <Button variant="outline" onClick={() => document.getElementById('community-post-image-upload').click()}>
                        <Camera size={16}/> Add Photos
                      </Button>
                      <input
                        id="community-post-image-upload"
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
                  <Button onClick={handleSubmitPost} disabled={!postData.title.trim() || !postData.content.trim()}>
                    Create Post
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Community Post Modal */}
        {showCommunityPostModal && selectedCommunity && (
          <div 
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999999,
              padding: 16
            }}
          >
            <Card style={{
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              background: "var(--panel)",
              color: "var(--text)"
            }}>
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{ margin: 0 }}>Create a Post in {selectedCommunity.name}</h2>
                  <Button variant="ghost" onClick={() => {
                    setShowCommunityPostModal(false);
                    resetPostData();
                  }}><X size={20}/></Button>
                </div>

                <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--accent)", color: "white", borderRadius: "8px", fontSize: "14px" }}>
                  <strong>🏷️ Community Tagged:</strong> This post will automatically appear in {selectedCommunity.name} and the main Community Feed!
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
                    <label style={{ display: "block", marginBottom: 8, fontWeight: "500" }}>What's happening in {selectedCommunity.name}?</label>
                    <Textarea
                      value={postData.content}
                      onChange={(e) => setPostData({ ...postData, content: e.target.value })}
                      placeholder={`Share your thoughts, experiences, or questions about ${selectedCommunity.name.toLowerCase()}...`}
                      rows={4}
                    />
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
                      <Button variant="outline" onClick={() => document.getElementById('community-specific-post-image-upload').click()}>
                        <Camera size={16}/> Add Photos
                      </Button>
                      <input
                        id="community-specific-post-image-upload"
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
                      <div style={{ marginBottom: 8 }}>
                        <strong>Community:</strong> {selectedCommunity.name} (automatically tagged)
                      </div>
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
                    setShowCommunityPostModal(false);
                    resetPostData();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitPost} disabled={!postData.title.trim() || !postData.content.trim()}>
                    Create Post in {selectedCommunity.name}
                  </Button>
                </div>
              </div>
            </Card>
        </div>
        )}

        {/* Create Community Modal */}
        {showCreateCommunityModal && (
          <div 
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999999,
              padding: 16
            }}
          >
            <Card style={{
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              background: "var(--panel)",
              color: "var(--text)"
            }}>
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{ margin: 0 }}>Create a New Community</h2>
                  <Button variant="ghost" onClick={() => {
                    setShowCreateCommunityModal(false);
                    setCreateCommunityData({
                      name: "",
                      description: "",
                      icon: "PawPrint"
                    });
                  }}><X size={20}/></Button>
                </div>

                <div style={{ display: "grid", gap: 24 }}>
                  {/* Community Name */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Community Name *</label>
                    <Input
                      value={createCommunityData.name}
                      onChange={(e) => setCreateCommunityData({ ...createCommunityData, name: e.target.value })}
                      placeholder="e.g., Hamster Lovers, Bird Photography, Reptile Care"
                      style={{ fontSize: "16px" }}
                    />
                  </div>

                  {/* Community Description */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Description *</label>
                    <Textarea
                      value={createCommunityData.description}
                      onChange={(e) => setCreateCommunityData({ ...createCommunityData, description: e.target.value })}
                      placeholder="Describe what this community is about, what topics will be discussed, and who it's for..."
                      rows={4}
                      style={{ fontSize: "16px" }}
                    />
                  </div>

                  {/* Icon Selection */}
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Choose an Icon</label>
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", 
                      gap: 12,
                      maxHeight: "200px",
                      overflowY: "auto",
                      padding: "16px",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      background: "var(--panel)"
                    }}>
                      {[
                        { name: "PawPrint", icon: PawPrint, label: "Paw Print" },
                        { name: "Dog", icon: Dog, label: "Dog" },
                        { name: "Cat", icon: Cat, label: "Cat" },
                        { name: "Bird", icon: Bird, label: "Bird" },
                        { name: "Fish", icon: Fish, label: "Fish" },
                        { name: "Turtle", icon: Turtle, label: "Turtle" },
                        { name: "Rabbit", icon: Rabbit, label: "Rabbit" },
                        { name: "Rat", icon: Rat, label: "Rat" },
                        { name: "Snail", icon: Snail, label: "Snail" },
                        { name: "Bug", icon: Bug, label: "Bug" },
                        { name: "Bone", icon: Bone, label: "Bone" },
                        { name: "Egg", icon: Egg, label: "Egg" },
                        { name: "Panda", icon: Panda, label: "Panda" },
                        { name: "Squirrel", icon: Squirrel, label: "Squirrel" },
                        { name: "Worm", icon: Worm, label: "Worm" },
                        { name: "Shell", icon: Shell, label: "Shell" },
                        { name: "Camera", icon: Camera, label: "Camera" },
                        { name: "Heart", icon: Heart, label: "Heart" },
                        { name: "Users", icon: Users, label: "Users" },
                        { name: "MessageCircle", icon: MessageCircle, label: "Message" }
                      ].map((iconOption) => (
                        <div
                          key={iconOption.name}
                          onClick={() => setCreateCommunityData({ ...createCommunityData, icon: iconOption.name })}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 8,
                            padding: "12px 8px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            border: createCommunityData.icon === iconOption.name ? "2px solid var(--accent)" : "1px solid var(--border)",
                            background: createCommunityData.icon === iconOption.name ? "var(--accent)" : "transparent",
                            color: createCommunityData.icon === iconOption.name ? "white" : "inherit",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <iconOption.icon size={24} />
                          <span style={{ fontSize: "11px", textAlign: "center" }}>{iconOption.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  {createCommunityData.name && (
                    <div style={{ 
                      padding: 16, 
                      border: "1px solid var(--border)", 
                      borderRadius: "8px",
                      background: "var(--panel)"
                    }}>
                      <h4 style={{ margin: "0 0 12px 0" }}>Community Preview</h4>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ 
                          height: 48, 
                          width: 48, 
                          borderRadius: 12, 
                          background: "color-mix(in lab, var(--accent) 20%, transparent)", 
                          display: "grid", 
                          placeItems: "center" 
                        }}>
                          {(() => {
                            const IconComponent = createCommunityData.icon === 'PawPrint' ? PawPrint :
                                                 createCommunityData.icon === 'Camera' ? Camera :
                                                 createCommunityData.icon === 'HeartHandshake' ? HeartHandshake :
                                                 createCommunityData.icon === 'Heart' ? Heart :
                                                 createCommunityData.icon === 'MessageCircle' ? MessageCircle :
                                                 createCommunityData.icon === 'Users' ? Users :
                                                 createCommunityData.icon === 'Dog' ? Dog :
                                                 createCommunityData.icon === 'Cat' ? Cat :
                                                 createCommunityData.icon === 'Bird' ? Bird :
                                                 createCommunityData.icon === 'Fish' ? Fish :
                                                 createCommunityData.icon === 'Turtle' ? Turtle :
                                                 createCommunityData.icon === 'Rabbit' ? Rabbit :
                                                 createCommunityData.icon === 'Rat' ? Rat :
                                                 createCommunityData.icon === 'Snail' ? Snail :
                                                 createCommunityData.icon === 'Bug' ? Bug :
                                                 createCommunityData.icon === 'Bone' ? Bone :
                                                 createCommunityData.icon === 'Egg' ? Egg :
                                                 createCommunityData.icon === 'Panda' ? Panda :
                                                 createCommunityData.icon === 'Squirrel' ? Squirrel :
                                                 createCommunityData.icon === 'Worm' ? Worm :
                                                 createCommunityData.icon === 'Shell' ? Shell :
                                                 PawPrint;
                            return <IconComponent size={24} color="var(--accent)" />;
                          })()}
                        </div>
                        <div>
                          <h5 style={{ margin: "0 0 4px 0" }}>{createCommunityData.name}</h5>
                          <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px" }}>{createCommunityData.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "flex-end" }}>
                  <Button variant="outline" onClick={() => {
                    setShowCreateCommunityModal(false);
                    setCreateCommunityData({
                      name: "",
                      description: "",
                      icon: "PawPrint"
                    });
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateCommunity} 
                    disabled={!createCommunityData.name.trim() || !createCommunityData.description.trim()}
                  >
                    Create Community
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}


      </section>
      </div>
    </div>
  );
}
