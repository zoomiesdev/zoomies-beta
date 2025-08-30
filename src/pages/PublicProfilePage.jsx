import React, { useState, useEffect } from "react";
import { Card, Button, Chip, Input, Textarea } from "../components/ui.jsx";
import { 
  MapPin, Users, Share2, PawPrint, ArrowLeft, Calendar, Heart, Trophy, Star, 
  MessageCircle, TrendingUp, Globe, Instagram, Camera, ChevronUp, ChevronDown, ArrowRight
} from "lucide-react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { useTheme } from "../theme/useTheme";
import { useAuth } from "../contexts/useAuth";

const onImgError = (e) => (e.currentTarget.src = "https://picsum.photos/seed/zoomies/1200/600");

export default function PublicProfilePage() {
  const { userId } = useParams();
  const { theme: userTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [tab, setTab] = useState("Timeline");
  
  // Post interaction state
  const [postVotes, setPostVotes] = useState(new Map()); // postId -> voteType
  const [comments, setComments] = useState({}); // postId -> comments array
  const [commentsLoading, setCommentsLoading] = useState({}); // postId -> loading state
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(new Set()); // postId -> boolean

  // Helper function to get card background color (same as UserProfilePage)
  const getCardBackgroundColor = () => {
    // If user has explicitly chosen a theme (not 'default'), use CSS variables
    if (profileData?.customization?.theme !== 'default') {
      return 'var(--panel)';
    }
    
    // If using default theme, check user's system preference
    if (userTheme === 'dark') {
      return '#161616'; // Solid dark background for dark mode
    }
    
    return 'var(--panel)'; // Use CSS variable for light mode
  };

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      
      console.log('Loading profile for userId:', userId);
      setLoading(true);
      try {
        // Get user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) {
          // If no profile exists, create a basic one with just the user ID
          setProfileData({
            user_id: userId,
            full_name: `User ${userId.slice(0, 8)}`,
            bio: null,
            avatar_url: null,
            banner_url: null,
            location: null,
            website: null,
            instagram: null,
            tags: [],
            days_active: 0,
            animals_helped: 0,
            sanctuaries_supported: 0,
            rating: 0,
            followers: 0,
            customization: {
              theme: "default",
              backgroundType: "color",
              backgroundColor: "#ffffff",
              accentColor: "#3b82f6",
              headerTextColor: "#000000",
              bodyTextColor: "#000000",
              sidebarWidgets: ['about', 'activity-stats']
            }
          });
        } else {
          // Set default customization if none exists
          const defaultCustomization = {
            theme: "default",
            backgroundType: "color",
            backgroundColor: "#ffffff",
            accentColor: "#3b82f6",
            headerTextColor: "#000000",
            bodyTextColor: "#000000",
            sidebarWidgets: ['about', 'activity-stats']
          };
          
          setProfileData({
            ...profile,
            customization: profile.customization || defaultCustomization
          });
        }

        // Load user's posts
        await loadUserPosts(userId);
        
        // Debug: Check all posts in database
        const { data: allPosts, error: allPostsError } = await supabase
          .from('community_posts')
          .select('*')
          .limit(5);
        console.log('All posts in database (first 5):', allPosts);
        if (allPostsError) console.error('Error fetching all posts:', allPostsError);
        
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  // Load user's posts
  const loadUserPosts = async (userId) => {
    console.log('Loading posts for user:', userId);
    setPostsLoading(true);
    try {
      // First, let's check what user IDs exist in posts
      const { data: allUserIds, error: userIdsError } = await supabase
        .from('community_posts')
        .select('user_id')
        .limit(100);
      
      if (!userIdsError && allUserIds) {
        const uniqueUserIds = [...new Set(allUserIds.map(p => p.user_id))];
        console.log('Unique user IDs in posts:', uniqueUserIds);
        console.log('Looking for userId:', userId);
        console.log('userId type:', typeof userId);
      }

      const { data: userPosts, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          community:communities(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('Posts query result:', { userPosts, error });

      if (!error && userPosts) {
        console.log('Setting posts:', userPosts);
        setPosts(userPosts);
      } else if (error) {
        console.error('Supabase error loading posts:', error);
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
          const upvotes = post.upvotes || 0;
          const downvotes = post.downvotes || 0;
          
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
      // Load comments if not already loaded
      if (!comments[postId] && !commentsLoading[postId]) {
        await loadComments(postId);
      }
    }
  };

  // Load comments for a post
  const loadComments = async (postId) => {
    setCommentsLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user:user_profiles(full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (!error && commentsData) {
        setComments(prev => ({ ...prev, [postId]: commentsData }));
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setCommentsLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Create a new comment
  const handleCreateComment = async (postId) => {
    if (!user || !newComment.trim()) return;
    
    try {
      const { data: comment, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        })
        .select()
        .single();
      
      if (!error && comment) {
        // Add comment to local state
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), comment]
        }));
        
        // Update post comment count
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return { ...post, comments: (post.comments || 0) + 1 };
          }
          return post;
        }));
        
        setNewComment("");
      }
    } catch (err) {
      console.error('Error creating comment:', err);
    }
  };

  // Open post detail view
  const openPostDetail = async (post) => {
    // Navigate to community page and pass post ID as state
    navigate('/community', { state: { viewPostId: post.id } });
  };

  if (loading) {
    return (
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <div style={{ animation: "spin 1s linear infinite", fontSize: "32px", marginBottom: "16px" }}>⟳</div>
        <p style={{ margin: 0, color: "var(--muted)" }}>Loading profile...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <div style={{ marginBottom: 24 }}>
          <PawPrint size={64} style={{ color: "var(--muted)", marginBottom: "16" }} />
          <h3 style={{ margin: "0 0 12px 0", fontSize: "24px" }}>Profile Not Found</h3>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "16px" }}>
            {error || "This user's profile could not be loaded."}
          </p>
        </div>
        <Link to="/community">
          <Button>← Back to Community</Button>
        </Link>
      </div>
    );
  }

  const displayName = profileData.full_name || "Anonymous User";
  const daysActive = profileData.days_active || 0;
  const animalsHelped = profileData.animals_helped || 0;
  const sanctuariesSupported = profileData.sanctuaries_supported || 0;
  const rating = profileData.rating || 0;
  const followers = profileData.followers || 0;
  const customization = profileData.customization;

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
      <div style={{ 
        marginTop: 24,
        minHeight: '100vh',
        padding: '0 16px 16px 16px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Back Button */}
        <div style={{ marginBottom: 16 }}>
          <Link to="/community" style={{ textDecoration: "none" }}>
            <Button variant="ghost" style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 8,
              background: getCardBackgroundColor(),
              border: "1px solid var(--border)"
            }}>
              <ArrowLeft size={20}/> Back to Community
            </Button>
          </Link>
        </div>

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
            background: profileData.banner_url && profileData.banner_url.trim() !== "" 
              ? `url(${profileData.banner_url}) center/cover`
              : `linear-gradient(135deg, ${customization.accentColor}, ${customization.accentColor}dd)`
          }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,0))" }} />
          </div>
          
          {/* Profile Picture - Positioned to overlap banner */}
          <div style={{ position: "absolute", top: 180, left: 24, zIndex: 10 }}>
            {profileData.avatar_url && profileData.avatar_url.trim() !== "" ? (
              <img
                src={profileData.avatar_url}
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
                {displayName}
              </h2>
              <div className="muted" style={{ fontSize: 16, color: customization.accentColor, fontWeight: 500, marginBottom: 4 }}>
                Animal Advocate
              </div>
              <div className="muted" style={{ fontSize: 14, color: customization.bodyTextColor }}>
                Animal Advocate • {profileData.location || "Location not set"}
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4, display: "flex", gap: 12, alignItems: "center", color: customization.bodyTextColor }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={14} /> {profileData.location || "Location not set"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Users size={14} /> {followers} followers
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
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
                    {profileData.bio || "This user hasn't written a bio yet."}
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
                    <span className="chip" style={{ backgroundColor: "var(--muted)", color: 'var(--text)' }}>
                      Animal Lover
                    </span>
                  )}
                </div>
              </Card>

              {/* Activity Stats */}
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
                      {followers}
                    </div>
                    <div className="muted" style={{ color: customization.bodyTextColor }}>Followers</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: "bold", color: customization.accentColor }}>
                      {animalsHelped}
                    </div>
                    <div className="muted" style={{ color: customization.bodyTextColor }}>Animals Helped</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: "bold", color: customization.accentColor }}>
                      {sanctuariesSupported}
                    </div>
                    <div className="muted" style={{ color: customization.bodyTextColor }}>Sanctuaries</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: "bold", color: customization.accentColor }}>
                      {daysActive}
                    </div>
                    <div className="muted" style={{ color: customization.bodyTextColor }}>Days Active</div>
                  </div>
                </div>
              </Card>

              {/* Contact Info */}
              {(profileData.website || profileData.instagram) && (
                <Card className="card" style={{ 
                  padding: 16, 
                  width: "100%", 
                  marginBottom: 16,
                  backgroundColor: getCardBackgroundColor(),
                  backdropFilter: 'none'
                }}>
                  <h3 style={{ marginTop: 0, color: customization.headerTextColor }}>Contact</h3>
                  <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
                    {profileData.website && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Globe size={16} color="var(--muted)"/>
                        <a 
                          href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: customization.accentColor, textDecoration: "none" }}
                        >
                          {profileData.website}
                        </a>
                      </div>
                    )}
                    {profileData.instagram && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Instagram size={16} color="var(--muted)"/>
                        <a 
                          href={`https://instagram.com/${profileData.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: customization.accentColor, textDecoration: "none" }}
                        >
                          {profileData.instagram}
                        </a>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Main Content */}
            <div>
              {tab === "Timeline" && (
                <Card className="card" style={{ 
                  padding: 16,
                  backgroundColor: getCardBackgroundColor(),
                  backdropFilter: 'none'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: 16, color: customization.headerTextColor }}>
                    Recent Posts
                  </h3>

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
                        {displayName} hasn't shared anything yet.
                      </p>
                      <div style={{ marginTop: 16, fontSize: "12px", color: "var(--muted)" }}>
                        Debug: posts.length = {posts.length}, postsLoading = {postsLoading.toString()}
                      </div>
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
                              {displayName[0]?.toUpperCase() || "U"}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: "14px" }}>
                                {displayName}
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
                            <Chip style={{ fontSize: "12px", marginBottom: 8 }}>{post.topic}</Chip>
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
                              {user && (
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
                              )}

                              {/* Comments List */}
                              {commentsLoading[post.id] ? (
                                <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                                  <div style={{ animation: "spin 1s linear infinite", fontSize: "16px" }}>⟳</div>
                                  <p style={{ margin: "8px 0 0 0", fontSize: "14px" }}>Loading comments...</p>
                                </div>
                              ) : comments[post.id] && comments[post.id].length > 0 ? (
                                <div style={{ display: "grid", gap: 12 }}>
                                  {comments[post.id].map((comment) => (
                                    <div key={comment.id} style={{ 
                                      padding: "12px", 
                                      background: "var(--panel)", 
                                      borderRadius: "8px",
                                      border: "1px solid var(--border)"
                                    }}>
                                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                        <div style={{ height: 24, width: 24, borderRadius: 999, background: "var(--accent)", display: "grid", placeItems: "center", color: "white", fontSize: "10px", fontWeight: "600" }}>
                                          {comment.user?.full_name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontWeight: 600, fontSize: "12px" }}>
                                            {comment.user?.full_name || "Anonymous User"}
                                          </div>
                                          <div className="muted" style={{ fontSize: "10px" }}>
                                            {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                                          </div>
                                        </div>
                                      </div>
                                      <div style={{ fontSize: "13px", lineHeight: 1.4 }}>
                                        {comment.content}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                                  <MessageCircle size={24} style={{ marginBottom: "8px", opacity: 0.5 }}/>
                                  <p style={{ margin: 0, fontSize: "14px" }}>No comments yet</p>
                                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.7 }}>
                                    Be the first to share your thoughts!
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {tab === "Gallery" && (
                <Card className="card" style={{ 
                  padding: 16,
                  backgroundColor: getCardBackgroundColor(),
                  backdropFilter: 'none'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: 16, color: customization.headerTextColor }}>
                    Gallery
                  </h3>
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    <Camera size={48} style={{ marginBottom: "16px", opacity: 0.5 }}/>
                    <p style={{ margin: 0, fontSize: "16px" }}>No images yet</p>
                    <p style={{ margin: "8px 0 0 0", fontSize: "14px", opacity: 0.7 }}>
                      {displayName} hasn't shared any photos yet.
                    </p>
                  </div>
                </Card>
              )}

              {tab === "About" && (
                <Card className="card" style={{ 
                  padding: 16,
                  backgroundColor: getCardBackgroundColor(),
                  backdropFilter: 'none'
                }}>
                  <h3 style={{ marginTop: 0, marginBottom: 16, color: customization.headerTextColor }}>
                    About {displayName}
                  </h3>
                  <div style={{ display: "grid", gap: 16 }}>
                    <div>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", color: customization.headerTextColor }}>Bio</h4>
                      <p style={{ margin: 0, lineHeight: 1.6, color: customization.bodyTextColor }}>
                        {profileData.bio || "This user hasn't written a bio yet."}
                      </p>
                    </div>
                    
                    <div>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", color: customization.headerTextColor }}>Location</h4>
                      <p style={{ margin: 0, lineHeight: 1.6, color: customization.bodyTextColor }}>
                        {profileData.location || "Location not specified"}
                      </p>
                    </div>

                    <div>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", color: customization.headerTextColor }}>Interests</h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {profileData.tags && profileData.tags.length > 0 ? (
                          profileData.tags.map((tag, index) => (
                            <Chip key={index} style={{ fontSize: "12px" }}>{tag}</Chip>
                          ))
                        ) : (
                          <span className="chip" style={{ fontSize: "12px" }}>Animal Lover</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
