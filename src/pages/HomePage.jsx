import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Button, Input, Chip, Textarea } from "../components/ui.jsx";
import {
  Camera,
  Hash,
  Image as ImageIcon,
  Users,
  Heart,
  PawPrint,
  PlayCircle,
  Sparkles,
  TrendingUp,
  Shield,
  CheckCircle2,
  ArrowRight,
  Clock,
  Star,
  MessageCircle,
  Share,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "../contexts/useAuth";
import { communityService } from "../services/communityService.js";
import { supabase } from "../lib/supabase.js";

/**
 * Zoomies HomePage – feed-first, product-aware (rev E)
 * Changes from your paste:
 * - FUN HERO: replaced headline paragraph with animated paw-print trail marching toward the CTAs
 * - PRODUCT EXPLAINER: added "What is Zoomies?" card ABOVE the composer
 * - Kept your modal-based composer, tabs, feed, and footer intact
 */

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [feedTab, setFeedTab] = useState("recent"); // "recent" or "top"
  const [userProfiles, setUserProfiles] = useState(new Map());
  const [postVotes, setPostVotes] = useState(new Map());
  const [showComments, setShowComments] = useState(new Set());
  const [comments, setComments] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});

  // Post creation state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postData, setPostData] = useState({
    title: "",
    content: "",
    images: [],
    community: "",
    topic: "",
  });
  const [communities, setCommunities] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  const stats = {
    raisedToday: 2485,
    animalsHelped: 37,
    supporters: 912,
    sanctuaries: 51,
  };

  const TOPICS = [
    "Animal Care",
    "Pet Pics",
    "Rescue Stories",
    "Wildlife",
    "Adoption",
    "Volunteering",
    "Donations",
    "Education",
    "Events",
    "Tips & Advice",
  ];

  // Load communities for post creation
  useEffect(() => {
    const loadCommunities = async () => {
      try {
        const { data: communitiesData, error } = await communityService.getCommunities();
        if (error) throw error;
        setCommunities(communitiesData || []);
      } catch (error) {
        console.error("Error loading communities:", error);
      }
    };

    loadCommunities();
  }, []);

  // Load user profile for post creation
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        const { data: profileData, error } = await supabase
          .from("user_profiles")
          .select("avatar_url, full_name")
          .eq("user_id", user.id)
          .single();

        if (!error && profileData) {
          setUserProfile(profileData);
        }
      } catch (err) {
        console.log("Could not fetch user profile:", err);
      }
    };

    loadUserProfile();
  }, [user]);

  // Load posts based on selected tab
  useEffect(() => {
    const loadPosts = async () => {
      setPostsLoading(true);
      try {
        const { data: allPosts, error } = await communityService.getAllPosts(20);
        if (error) throw error;

        let sortedPosts = allPosts || [];

        if (feedTab === "top") {
          // Sort by engagement (votes + comments)
          sortedPosts = sortedPosts.sort((a, b) => {
            const aEngagement = (a.upvotes || 0) + (a.downvotes || 0) + (a.comment_count || 0);
            const bEngagement = (b.upvotes || 0) + (b.downvotes || 0) + (b.comment_count || 0);
            return bEngagement - aEngagement;
          });
        } else {
          // Recent posts are already sorted by created_at desc
          sortedPosts = allPosts || [];
        }

        setPosts(sortedPosts);
      } catch (error) {
        console.error("Error loading posts:", error);
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    loadPosts();
  }, [feedTab]);

  // Load user profiles for post authors
  useEffect(() => {
    const loadUserProfiles = async () => {
      if (!posts.length) return;

      try {
        const userIds = [...new Set(posts.map((post) => post.user_id).filter(Boolean))];

        if (userIds.length === 0) return;

        const { data: profiles, error } = await supabase
          .from("user_profiles")
          .select("user_id, avatar_url, full_name, username")
          .in("user_id", userIds);

        if (!error && profiles) {
          const profileMap = new Map();
          profiles.forEach((profile) => {
            profileMap.set(profile.user_id, profile);
          });
          setUserProfiles(profileMap);
        }
      } catch (err) {
        console.error("Error loading user profiles:", err);
      }
    };

    loadUserProfiles();
  }, [posts]);

  // Handle post creation
  const handleCreatePost = async () => {
    if (!user) {
      setShowPostModal(false);
      return;
    }

    if (!postData.title.trim() || !postData.content.trim()) {
      alert("Please enter both a title and content for your post.");
      return;
    }

    try {
      // Prepare post data
      const postPayload = {
        title: postData.title,
        content: postData.content,
        topic: postData.topic || null,
        images: postData.images || [],
      };

      // Get community ID if a community was selected
      let communityId = null;
      if (postData.community) {
        const selectedCommunity = communities.find((c) => c.name === postData.community);
        communityId = selectedCommunity ? selectedCommunity.id : null;
      }

      const { error } = await communityService.createPost(user.id, communityId, postPayload);

      if (error) throw error;

      // Reset form and close modal
      setPostData({ title: "", content: "", images: [], community: "", topic: "" });
      setShowPostModal(false);

      // Refresh posts
      const { data: allPosts, error: fetchError } = await communityService.getAllPosts(20);
      if (!fetchError) {
        setPosts(allPosts || []);
      }

      alert("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    }
  };

  // Handle post voting
  const handlePostVote = async (postId, voteType) => {
    if (!user) return;

    try {
      const { error } = await communityService.voteOnPost(user.id, postId, voteType);
      if (error) throw error;

      // Update local state
      setPostVotes((prev) => new Map(prev).set(postId, voteType));

      // Update post vote counts locally
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            const currentVote = postVotes.get(postId);
            let upvotes = post.upvotes || 0;
            let downvotes = post.downvotes || 0;

            if (currentVote === 1) upvotes--;
            if (currentVote === -1) downvotes--;
            if (voteType === 1) upvotes++;
            if (voteType === -1) downvotes++;

            return { ...post, upvotes, downvotes };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Error voting on post:", error);
    }
  };

  // Comments
  const loadComments = async (postId) => {
    if (comments[postId]) return;

    setCommentsLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const { data: postComments, error } = await communityService.getPostComments(postId);
      if (error) throw error;
      setComments((prev) => ({ ...prev, [postId]: postComments || [] }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments((prev) => ({ ...prev, [postId]: [] }));
    } finally {
      setCommentsLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = (postId) => {
    if (!showComments.has(postId)) {
      loadComments(postId);
    }
    setShowComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 2592000)}mo`;
  };

  return (
    <div className="container" style={{ paddingTop: 0, marginTop: 16 }}>
             {/* Inline keyframes for the hero paw animation */}
       <style>{`
         @keyframes paw-walk {
           0% { transform: translateX(-20%) translateY(0) rotate(0deg); opacity: 0; }
           10% { opacity: 1; }
           50% { transform: translateX(40%) translateY(-6px) rotate(8deg); }
           80% { transform: translateX(60%) translateY(0) rotate(0deg); opacity: 1; }
           100% { transform: translateX(70%) translateY(0) rotate(0deg); opacity: 0; }
         }
         
         /* Make paw prints white on light mode */
         @media (prefers-color-scheme: light) {
           .paw-print {
             filter: brightness(0) invert(1);
           }
         }
       `}</style>

      {/* HERO STRIP with animated paw prints marching toward CTAs */}
      <Card
        style={{
          marginBottom: 12,
          padding: 16,
          background: "linear-gradient(135deg, rgba(255,20,147,.10), rgba(255,255,255,.04))",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
                     {/* Animated lane */}
           <div style={{ position: "relative", height: 56 }} aria-hidden>
             {[0, 1, 2, 3, 4, 5].map((i) => (
               <PawPrint
                 key={i}
                 size={22}
                 className="paw-print"
                 style={{
                   position: "absolute",
                   left: 0,
                   top: i % 2 === 0 ? 6 + (i * 8) : 18 + (i * 8),
                   opacity: 0.8,
                   animation: `paw-walk 3.2s ${0.4 * i}s linear infinite`,
                 }}
               />
             ))}
           </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 8, justifySelf: "end" }}>
            <Link to="/community" style={{ textDecoration: "none" }}>
              <Button>
                <Users size={16} style={{ marginRight: 6 }} /> Join the Community
              </Button>
            </Link>
            <Link to="/ambassador" style={{ textDecoration: "none" }}>
              <Button variant="outline">
                <PawPrint size={16} style={{ marginRight: 6 }} /> Find Animals
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="row">
        {/* Left rail */}
        <aside className="card" style={{ gridColumn: "span 3", padding: 16 }}>
          {/* sponsor carousel placeholder */}
          <div
            className="card"
            style={{
              height: 120,
              background: "linear-gradient(135deg, rgba(255,20,147,.12), rgba(255,255,255,.06))",
              display: "grid",
              placeItems: "center",
              border: "1px dashed var(--border)",
            }}
          >
            <span className="muted">Sponsor logos carousel</span>
          </div>

          <div style={{ height: 12 }} />

          <Card style={{ padding: 12 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <Button variant="outline">
                <PawPrint size={16} style={{ marginRight: 6 }} /> Become a Sanctuary Partner
              </Button>
              <Button variant="outline">
                <Users size={16} style={{ marginRight: 6 }} /> Invite Friends
              </Button>
            </div>
          </Card>

          <div style={{ height: 16 }} />

          <Card style={{ padding: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, textAlign: "center" }}>
              {[
                { label: "Raised Today", value: `$${formatNumber(stats.raisedToday)}` },
                { label: "Animals Helped", value: `${formatNumber(stats.animalsHelped)}` },
                { label: "Supporters", value: `${formatNumber(stats.supporters)}` },
                { label: "Sanctuaries", value: `${formatNumber(stats.sanctuaries)}` },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{s.value}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </aside>

                  {/* Center column */}
          <main style={{ gridColumn: "span 6", display: "grid", gap: 16 }}>
            {/* COMPOSER */}
          <Card style={{ padding: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <img
                src={userProfile?.avatar_url || "https://picsum.photos/seed/default/64/64"}
                alt="avatar"
                width={36}
                height={36}
                style={{ borderRadius: 999, objectFit: "cover" }}
              />
              <div
                style={{
                  flex: 1,
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: "20px",
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,.02)",
                  color: "var(--text-muted)",
                }}
                onClick={() => setShowPostModal(true)}
              >
                {user ? "Share an update…" : "Login to post…"}
              </div>
            </div>
            <div className="muted" style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 14 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Camera size={16} /> Photo/Video
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ImageIcon size={16} /> GIF
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Hash size={16} /> Poll
              </span>
            </div>
          </Card>

          {/* FEED TABS */}
          <Card style={{ padding: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "recent", label: "Recent", icon: Clock },
                { key: "top", label: "Top", icon: Star },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.key}
                    variant={feedTab === tab.key ? undefined : "outline"}
                    onClick={() => setFeedTab(tab.key)}
                  >
                    <Icon size={16} style={{ marginRight: 6 }} />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* FEED */}
          <div style={{ display: "grid", gap: 12 }}>
            {postsLoading ? (
              <Card style={{ padding: 24, textAlign: "center" }}>
                <div className="muted">Loading posts...</div>
              </Card>
            ) : posts.length === 0 ? (
              <Card style={{ padding: 24, textAlign: "center" }}>
                <div className="muted">No posts yet. Be the first to share something!</div>
              </Card>
            ) : (
              posts.map((post) => {
                const authorProfile = userProfiles.get(post.user_id);
                const currentVote = postVotes.get(post.id);
                const postComments = comments[post.id] || [];
                const isCommentsVisible = showComments.has(post.id);

                return (
                  <Card key={post.id} style={{ padding: 14 }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <img
                        src={authorProfile?.avatar_url || "https://picsum.photos/seed/default/64/64"}
                        alt="avatar"
                        width={40}
                        height={40}
                        style={{ borderRadius: 999, objectFit: "cover" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                          <strong>{authorProfile?.full_name || authorProfile?.username || "Anonymous User"}</strong>
                          <span className="muted" style={{ fontSize: 12 }}>
                            {post.community?.name && `• ${post.community.name}`} • {formatRelativeTime(post.created_at)}
                          </span>
                        </div>
                        <p style={{ marginTop: 6, marginBottom: 8 }}>{post.content}</p>
                        {post.images && post.images.length > 0 && (
                          <div
                            className="card"
                            style={{
                              overflow: "hidden",
                              border: "1px solid var(--border)",
                              background: "rgba(255,255,255,.04)",
                            }}
                          >
                            <img src={post.images[0]} alt="media" style={{ width: "100%", display: "block" }} />
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button
                              onClick={() => handlePostVote(post.id, currentVote === 1 ? 0 : 1)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: currentVote === 1 ? "var(--accent)" : "inherit",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <Heart size={16} fill={currentVote === 1 ? "currentColor" : "none"} />
                              {post.upvotes || 0}
                            </button>
                          </div>
                          <button
                            onClick={() => toggleComments(post.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "inherit",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <MessageCircle size={16} />
                            {post.comment_count || 0}
                          </button>
                          <Button variant="outline" size="sm">
                            <PawPrint size={16} style={{ marginRight: 6 }} /> Donate
                          </Button>

                          {/* Delete button - only show for user's own posts */}
                          {user && post.user_id === user.id && (
                            <button
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
                                  communityService.deletePost(post.id, user.id).then(({ error }) => {
                                    if (!error) {
                                      setPosts((prev) => prev.filter((p) => p.id !== post.id));
                                      alert("Post deleted successfully!");
                                    } else {
                                      alert("Failed to delete post. Please try again.");
                                    }
                                  });
                                }
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#dc2626",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: "14px",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                transition: "background-color 0.2s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.1)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                              title="Delete post"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          )}
                        </div>

                        {/* Comments Section */}
                        {isCommentsVisible && (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                            {commentsLoading[post.id] ? (
                              <div className="muted" style={{ textAlign: "center", padding: "12px" }}>
                                Loading comments...
                              </div>
                            ) : postComments.length > 0 ? (
                              <div style={{ display: "grid", gap: 8 }}>
                                {postComments.map((comment) => (
                                  <div key={comment.id} style={{ padding: "8px", background: "rgba(255,255,255,.02)", borderRadius: "6px" }}>
                                    <div style={{ display: "flex", gap: 6, alignItems: "baseline", marginBottom: 4 }}>
                                      <strong style={{ fontSize: "14px" }}>
                                        {comment.user?.user_metadata?.full_name || "Anonymous"}
                                      </strong>
                                      <span className="muted" style={{ fontSize: "12px" }}>
                                        {formatRelativeTime(comment.created_at)}
                                      </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: "14px" }}>{comment.content}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="muted" style={{ textAlign: "center", padding: "12px" }}>
                                No comments yet. Be the first to comment!
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </main>

        {/* Right rail */}
        <aside className="card" style={{ gridColumn: "span 3", padding: 16 }}>
          {/* Live Streams */}
          <Card style={{ padding: 12, marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: "rgba(255,255,255,.08)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <PlayCircle size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Sunny Hooves Farm</div>
                <div className="muted" style={{ fontSize: 12 }}>Pasture cam • 124 watching</div>
              </div>
            </div>
            <Button style={{ width: "100%", marginTop: 10 }}>Join</Button>
          </Card>

          <div style={{ height: 12 }} />

          {/* Trending */}
          <Card style={{ padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Hash size={16} /> <strong>Trending</strong>
            </div>
            <div className="muted" style={{ display: "grid", gap: 6, fontSize: 14 }}>
              <span>#goatcam</span>
              <span>#adoptionday</span>
              <span>#catrescue</span>
              <span>#wildlife</span>
            </div>
          </Card>

          <div style={{ height: 12 }} />

          {/* Newsletter */}
          <Card style={{ padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Get Zoomies updates</div>
            <Input placeholder="you@sanctuary.org" />
            <Button style={{ width: "100%", marginTop: 8 }}>Subscribe</Button>
          </Card>
        </aside>
      </div>

      {/* POST CREATION MODAL */}
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
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPostModal(false);
              setPostData({ title: "", content: "", images: [], community: "", topic: "" });
            }
          }}
        >
          <Card
            style={{
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              background: "var(--panel)",
              color: "var(--text)",
            }}
          >
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>Create a Post</h2>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPostModal(false);
                    setPostData({ title: "", content: "", images: [], community: "", topic: "" });
                  }}
                >
                  <X size={20} />
                </Button>
              </div>

              {!user ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <h3>Login to Post</h3>
                  <p className="muted">You need to be logged in to create posts.</p>
                  <Button onClick={() => setShowPostModal(false)}>Close</Button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      marginBottom: 16,
                      padding: "12px 16px",
                      background: "var(--accent)",
                      color: "white",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <strong>💡 Tip:</strong> Your post will appear in the Community Feed where other animal lovers can see and interact with it!
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreatePost();
                    }}
                  >
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
                        <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Tag Community (Optional)</label>
                        <select
                          value={postData.community}
                          onChange={(e) => setPostData({ ...postData, community: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            background: "var(--panel)",
                            color: "var(--text)",
                          }}
                        >
                          <option value="">No community tag</option>
                          {communities.map((community) => (
                            <option key={community.id} value={community.name}>
                              {community.name} - {community.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Topic Selection */}
                      <div>
                        <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Topic</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {TOPICS.map((topic) => (
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
                          <Button variant="outline" onClick={() => document.getElementById("homepage-post-image-upload").click()}>
                            <Camera size={16} /> Add Photos
                          </Button>
                          <input
                            id="homepage-post-image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const newImages = files.map((file) => ({
                                file,
                                preview: URL.createObjectURL(file),
                                name: file.name,
                              }));
                              setPostData((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
                            }}
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
                                  style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: "8px" }}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setPostData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
                                  }}
                                  style={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    background: "rgba(0,0,0,0.7)",
                                    color: "white",
                                    padding: "2px 6px",
                                    minWidth: "auto",
                                  }}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Post Preview */}
                      {(postData.title || postData.content) && (
                        <div style={{ padding: 16, border: "1px solid var(--border)", borderRadius: "8px", background: "var(--panel)" }}>
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
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPostModal(false);
                          setPostData({ title: "", content: "", images: [], community: "", topic: "" });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePost} disabled={!postData.title.trim() || !postData.content.trim()}>
                        Create Post
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* FOOTER */}
      <footer
        style={{
          marginTop: 20,
          padding: 16,
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 14,
        }}
      >
        <div className="muted">© {new Date().getFullYear()} Zoomies</div>
        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "About", href: "/about" },
            { label: "Pricing", href: "/pricing" },
            { label: "Docs", href: "/docs" },
            { label: "Terms", href: "/terms" },
            { label: "Privacy", href: "/privacy" },
          ].map((l) => (
            <a key={l.href} href={l.href} className="muted" style={{ textDecoration: "none" }}>
              {l.label}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  );
}

function formatNumber(n) {
  return new Intl.NumberFormat().format(n);
}
