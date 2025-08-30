import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Button, Input, Textarea, Chip } from "../components/ui.jsx";
import {
  MapPin, Users, Share2, Camera, MessageCircle, Heart, CalendarClock, Link as LinkIcon, PawPrint,
  ArrowLeft, Eye, Edit3, Upload
} from "lucide-react";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../contexts/useAuth.js";

export default function AnimalProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState("Timeline"); // Timeline | Gallery | About
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState(new Set());
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customization, setCustomization] = useState({
    primaryColor: "#FF6FAE",
    secondaryColor: "#e91e63",
    accentColor: "#9c27b0",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    borderColor: "#e0e0e0",
    borderRadius: "16px",
    fontFamily: "system-ui",
    showProgressBar: true,
    showSocialButtons: true,
    showRecentDonations: true,
    showTopSupporters: true,
    showFeaturedImage: true,
    showMilestones: false,
    showEvents: false,
    showWishlist: false,
    showPoll: false
  });

  // Image upload handler
  const handleImageUpload = async (type, file) => {
    if (!file) return;

    try {
      console.log(`=== UPLOADING ${type.toUpperCase()} FOR ANIMAL ===`);
      console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `animal-${type}-${animal.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      console.log('Uploading to path:', filePath);

      // Use the profile-images bucket (same as user profiles)
      const bucketName = 'profile-images';
      
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
      if (type === 'image') {
        setEditingAnimal(prev => ({ ...prev, image_url: publicUrl }));
        console.log('Updated image_url in local state');
      } else if (type === 'banner') {
        setEditingAnimal(prev => ({ ...prev, banner_url: publicUrl }));
        console.log('Updated banner_url in local state');
      }

      // Save to database
      console.log('Saving animal data to database...');
      const { error: updateError } = await supabase
        .from('animal_profiles')
        .update({
          [type === 'image' ? 'image_url' : 'banner_url']: publicUrl
        })
        .eq('id', animal.id);
      
      if (updateError) {
        console.error('Failed to save animal data after upload:', updateError);
        alert(`Upload succeeded but failed to save animal profile. Please try saving manually.`);
      } else {
        console.log(`${type} upload and save completed successfully`);
        alert(`${type === 'image' ? 'Profile photo' : 'Banner'} updated successfully!`);
        
        // Update the main animal state
        setAnimal(prev => ({
          ...prev,
          [type === 'image' ? 'image_url' : 'banner_url']: publicUrl
        }));
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload ${type}: ${error.message}`);
    }
  };

  // Calculate derived values using useMemo to ensure consistent hook order
  const pct = useMemo(() => {
    if (!animal || !animal.goal || animal.goal <= 0) return 0;
    return Math.min(100, Math.round((animal.raised / animal.goal) * 100));
  }, [animal]);

  const gallery = useMemo(() => posts.flatMap(p => p.images), [posts]);

  console.log('AnimalProfilePage loaded with ID:', id);

  // Load animal data from database
  useEffect(() => {
    const loadAnimal = async () => {
      try {
        setLoading(true);
        console.log('Loading animal with ID:', id);
        
        const { data: animalData, error } = await supabase
          .from('animal_profiles')
          .select(`
            id,
            name,
            species,
            breed,
            age,
            bio,
            story,
            goal,
            raised,
            status,
            image_url,
            banner_url,
            organization_id,
            created_at,
            updated_at
          `)
          .eq('id', id)
          .single();

        console.log('Supabase response:', { animalData, error });

        if (error) {
          console.error('Error loading animal:', error);
          setError('Animal not found');
          return;
        }

        setAnimal(animalData);
        
        // Check if current user owns this animal profile
        if (user) {
          try {
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('user_type')
              .eq('user_id', user.id)
              .single();
            
            if (userProfile?.user_type === 'organization') {
              // For organization accounts, check if they own this animal
              const { data: animalOwner } = await supabase
                .from('animal_profiles')
                .select('organization_id')
                .eq('id', id)
                .single();
              
              const isAnimalOwner = animalOwner?.organization_id === user.id;
              setIsOwner(isAnimalOwner);
              console.log('Ownership check result:', isAnimalOwner);
            }
          } catch (ownershipError) {
            console.error('Error checking ownership:', ownershipError);
            setIsOwner(false);
          }
        }
        
        // Start with empty posts - sanctuary staff will add real updates later
        setPosts([]);
        
      } catch (error) {
        console.error('Error loading animal:', error);
        setError('Failed to load animal profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadAnimal();
    }
  }, [id, user]);

  // Separate effect to ensure ownership check happens when user changes
  useEffect(() => {
    const checkOwnership = async () => {
      if (!user || !animal) return;
      
      try {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single();
        
        if (userProfile?.user_type === 'organization') {
          const { data: animalOwner } = await supabase
            .from('animal_profiles')
            .select('organization_id')
            .eq('id', animal.id)
            .single();
          
          const isAnimalOwner = animalOwner?.organization_id === user.id;
          setIsOwner(isAnimalOwner);
          console.log('Ownership check result:', isAnimalOwner);
        }
      } catch (ownershipError) {
        console.error('Error checking ownership:', ownershipError);
        setIsOwner(false);
      }
    };

    checkOwnership();
  }, [user, animal]);

  // Handle liking/unliking posts
  const handleLike = (postId) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Handle adding comments
  const handleAddComment = (postId) => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now().toString(),
      text: newComment,
      author: "You",
      time: "now",
      replyTo: replyingTo
    };
    
    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), comment]
    }));
    
    setNewComment("");
    setReplyingTo(null);
  };

  // Handle reply to comment
  const handleReply = (commentId) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  // Toggle comments visibility
  const toggleComments = (postId) => {
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

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center" }}>
        <div style={{ color: "var(--muted)" }}>Loading animal profile...</div>
      </div>
    );
  }

  if (error || !animal) {
    return (
      <div className="container" style={{ textAlign: "center" }}>
        <div style={{ color: "var(--muted)", marginBottom: "16px" }}>
          {error || 'Animal not found'}
        </div>
        <Link to="/ambassador">
          <Button variant="outline">
            <ArrowLeft size={16} style={{ marginRight: "8px" }} />
            Back to Ambassador Hub
          </Button>
        </Link>
      </div>
    );
  }



  return (
    <div className="container" style={{ display: "grid", gap: 16, paddingTop: "0", marginTop: "16px" }}>
      {/* Header */}
      <Card className="card" style={{ overflow: "hidden", position: "relative" }}>
        <div style={{ position: "relative", height: 200, background: animal.banner_url ? `url(${animal.banner_url}) center/cover` : "var(--panel)" }}>
          {!animal.banner_url && (
            <div style={{ 
              position: "absolute", 
              inset: 0, 
              display: "grid", 
              placeItems: "center",
              color: "var(--muted)",
              fontSize: "14px"
            }}>
              No banner image set
            </div>
          )}
          <div style={{ position: "absolute", inset: 0, background: animal.banner_url ? "linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,0))" : "none" }} />
        </div>
        
        {/* Profile Picture - Positioned to overlap banner */}
        <div style={{ position: "absolute", top: 180, left: 24, zIndex: 10 }}>
          {animal.image_url ? (
            <img
              src={animal.image_url}
              alt=""
              style={{
                height: 96, width: 96, borderRadius: 999, objectFit: "cover",
                border: "4px solid var(--bg, #fff)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}
            />
          ) : (
            <div style={{
              height: 96, width: 96, borderRadius: 999,
              border: "4px solid var(--bg, #fff)", 
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              background: "var(--border)",
              display: "grid",
              placeItems: "center",
              fontSize: "36px",
              color: "var(--muted)"
            }}>
              {animal.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
        </div>
        
        {/* Content below banner */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 16px 16px 140px" }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{animal.name}</h2>
            <div className="muted" style={{ fontSize: 14 }}>
              {animal.species} • {animal.breed || 'Unknown Breed'} • Animal Sanctuary
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <MapPin size={14} /> Animal Sanctuary
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Users size={14} /> 0 followers
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isOwner ? (
              <>
                <Button variant="outline" onClick={() => {
                  setEditingAnimal({ ...animal });
                  setShowEditModal(true);
                }}>
                  <Edit3 size={16} style={{ marginRight: "8px" }} />
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={() => setShowCustomizeModal(true)}>
                  <Eye size={16} style={{ marginRight: "8px" }} />
                  Customize
                </Button>
                <Button variant="ghost"><Share2 size={16}/> Share</Button>
              </>
            ) : (
              <>
                <Button variant="outline">Follow</Button>
                <Button variant="ghost"><Share2 size={16}/> Share</Button>
              </>
            )}
          </div>

        </div>
      </Card>

      {/* Tabs */}
      <Card className="card" style={{ padding: 8 }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 8, alignItems: "start" }}>
        {/* Dynamic Sidebar Widgets */}
        <div style={{ position: "sticky", top: 16, height: "fit-content" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
            
            {/* About Widget - Always visible */}
            <Card className="card" style={{ padding: 16, width: "100%" }}>
              <h3 style={{ marginTop: 0 }}>About</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 14 }}>
                <div><span className="muted">Age:</span> {animal.age || 'Unknown'}</div>
                <div><span className="muted">Species:</span> {animal.species}</div>
                <div><span className="muted">Breed:</span> {animal.breed || 'Unknown'}</div>
                <div><span className="muted">Status:</span> {animal.status}</div>
              </div>
              {animal.bio && (
                <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.5 }}>
                  {animal.bio}
                </div>
              )}
            </Card>

            {/* Fundraising Progress Widget */}
            {customization.showProgressBar && (
              <Card className="card" style={{ padding: 16, width: "100%" }}>
                <h3 style={{ marginTop: 0 }}>Support {animal.name}</h3>
                <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
                  Every donation goes toward food, vet care, enrichment, and sanctuary costs.
                </div>
                
                {animal.goal && animal.goal > 0 ? (
                  <>
                    <div style={{ height: 8, borderRadius: 8, background: "rgba(0,0,0,.12)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)" }} />
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                      ${animal.raised || 0} raised of ${animal.goal} goal
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      {[10, 25, 50].map(v => <Button key={v} variant="ghost">${v}</Button>)}
                      <Button variant="outline">Custom</Button>
                    </div>
                    <Button style={{ marginTop: 10 }}><Heart size={16}/> Donate</Button>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px" }}>
                      No fundraising goal set yet
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                      Contact the sanctuary to learn how you can help {animal.name}!
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Recent Donations Widget */}
            {customization.showRecentDonations && (
              <Card className="card" style={{ padding: 16, width: "100%" }}>
                <h3 style={{ marginTop: 0 }}>Recent Donations</h3>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                    No donations yet
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                    Be the first to support {animal.name}!
                  </div>
                </div>
              </Card>
            )}

            {/* Top Supporters Widget */}
            {customization.showTopSupporters && (
              <Card className="card" style={{ padding: 16, width: "100%" }}>
                <h3 style={{ marginTop: 0 }}>Top Supporters</h3>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                    No supporters yet
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                    Support {animal.name} to appear here!
                  </div>
                </div>
              </Card>
            )}

            {/* Featured Image Widget */}
            {customization.showFeaturedImage && animal.image_url && (
              <Card className="card" style={{ padding: 16, width: "100%" }}>
                <h3 style={{ marginTop: 0 }}>Featured Photo</h3>
                <img 
                  src={animal.image_url} 
                  alt={animal.name}
                  style={{ 
                    width: "100%", 
                    height: "120px", 
                    objectFit: "cover", 
                    borderRadius: "8px",
                    marginTop: "8px"
                  }} 
                />
              </Card>
            )}

            {/* Milestones Widget */}
            {customization.showMilestones && (
              <Card className="card" style={{ padding: 16, width: "100%" }}>
                <h3 style={{ marginTop: 0 }}>Milestones</h3>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                    No milestones yet
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                    Milestones will appear here as {animal.name} progresses
                  </div>
                </div>
              </Card>
            )}

            {/* Events Widget */}
            {customization.showEvents && (
              <Card className="card" style={{ padding: 16, width: "100%" }}>
                <h3 style={{ marginTop: 0 }}>Upcoming Events</h3>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                    No upcoming events
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                    Events will be posted here when scheduled
                  </div>
                </div>
              </Card>
            )}

            {/* Wishlist Widget */}
            {customization.showWishlist && (
              <Card className="card" style={{ padding: 16, width: "100%" }}>
                <h3 style={{ marginTop: 0 }}>Wishlist</h3>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                    No wishlist items yet
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                    Contact the sanctuary to learn what {animal.name} needs
                  </div>
                </div>
              </Card>
            )}

            {/* Poll Widget */}
            {customization.showPoll && (
              <Card className="card" style={{ padding: 16, width: "100%" }}>
                <h3 style={{ marginTop: 0 }}>Community Poll</h3>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ color: "var(--muted)", fontSize: "14px" }}>
                    No active polls
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                    Community polls will appear here when available
                  </div>
                </div>
              </Card>
            )}

          </div>
        </div>

        {/* Main column */}
        <div style={{ display: "grid", gap: 16 }}>
          {tab === "Timeline" && (
            <>
              {/* Feed */}
              {posts.length === 0 ? (
                <Card className="card" style={{ padding: "40px", textAlign: "center" }}>
                  <div style={{ color: "var(--muted)", marginBottom: "16px" }}>
                    <MessageCircle size={48} style={{ opacity: 0.5, margin: "0 auto 16px auto" }} />
                  </div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
                    No updates yet
                  </h3>
                  <p style={{ margin: "0 0 16px 0", color: "var(--muted)", fontSize: "14px" }}>
                    Sanctuary staff will post updates about {animal.name}'s progress and care here.
                  </p>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                    Check back soon for news and photos!
                  </div>
                </Card>
              ) : (
                posts.map(p => (
                  <Card key={p.id} className="card" style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ height: 36, width: 36, borderRadius: 999, background: "var(--border)", display: "grid", placeItems: "center", fontSize: "12px", color: "var(--muted)" }}>
                        {animal.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.author}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{p.time} ago</div>
                      </div>
                      <Button variant="ghost"><Share2 size={16}/> Share</Button>
                    </div>
                    <p style={{ marginTop: 10, marginBottom: 10 }}>{p.text}</p>
                    {p.images?.length ? (
                      <div style={{ display: "grid", gridTemplateColumns: p.images.length > 1 ? "1fr 1fr" : "1fr", gap: 8 }}>
                        {p.images.map((src, i) => (
                          <img key={i} src={src} alt="" style={{ width: "100%", borderRadius: 12 }} />
                        ))}
                      </div>
                    ) : null}
                    <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 14 }}>
                      <button
                        onClick={() => handleLike(p.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: likedPosts.has(p.id) ? "var(--accent)" : "var(--muted)",
                          fontSize: "14px",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <Heart size={16} fill={likedPosts.has(p.id) ? "var(--accent)" : "none"} />
                        {p.likes + (likedPosts.has(p.id) ? 1 : 0)}
                      </button>
                      <button
                        onClick={() => toggleComments(p.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--muted)",
                          fontSize: "14px",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <MessageCircle size={16} />
                        {p.comments + (comments[p.id]?.length || 0)}
                      </button>
                    </div>

                    {/* Comments Section */}
                    {showComments.has(p.id) && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                        {/* Add Comment */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            style={{ flex: 1 }}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(p.id)}
                          />
                          <Button 
                            size="sm" 
                            onClick={() => handleAddComment(p.id)}
                            disabled={!newComment.trim()}
                          >
                            Comment
                          </Button>
                        </div>

                        {/* Existing Comments */}
                        <div style={{ display: "grid", gap: 12 }}>
                          {comments[p.id]?.map(comment => (
                            <div key={comment.id} style={{ 
                              padding: "12px", 
                              background: "var(--panel)", 
                              borderRadius: "8px",
                              border: "1px solid var(--border)"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                                <div style={{ fontWeight: 600, fontSize: "14px" }}>{comment.author}</div>
                                <div className="muted" style={{ fontSize: "12px" }}>{comment.time}</div>
                              </div>
                              <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>{comment.text}</p>
                              <button
                                onClick={() => handleReply(comment.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "var(--accent)",
                                  fontSize: "12px",
                                  padding: 0
                                }}
                              >
                                Reply
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </>
          )}

          {tab === "Gallery" && (
            <Card className="card" style={{ padding: 16 }}>
              {gallery.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <div style={{ color: "var(--muted)", marginBottom: "16px" }}>
                    <Camera size={48} style={{ opacity: 0.5, margin: "0 auto 16px auto" }} />
                  </div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>
                    No photos yet
                  </h3>
                  <p style={{ margin: "0 0 16px 0", color: "var(--muted)", fontSize: "14px" }}>
                    Photos of {animal.name} will appear here once they're added.
                  </p>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                    Check back soon for adorable pictures!
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {gallery.map((src, i) => (
                    <img key={i} src={src} alt="" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12 }} />
                  ))}
                </div>
              )}
            </Card>
          )}

          {tab === "About" && (
            <Card className="card" style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>About {animal.name}</h3>
              <p style={{ marginTop: 8, lineHeight: 1.6 }}>
                {animal.bio || "No bio available"}
              </p>
              {animal.story && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ marginTop: 0 }}>{animal.name}'s Story</h4>
                  <p style={{ marginTop: 8, lineHeight: 1.6 }}>
                    {animal.story}
                  </p>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
                <div><strong>Age:</strong> {animal.age || 'Unknown'}</div>
                <div><strong>Species:</strong> {animal.species}</div>
                <div><strong>Breed:</strong> {animal.breed || 'Unknown'}</div>
                <div><strong>Status:</strong> {animal.status}</div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Animal Profile Modal */}
      {showEditModal && editingAnimal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <Card style={{
            width: "90%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflow: "auto",
            padding: "24px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0 }}>Edit {editingAnimal.name}'s Profile</h2>
              <Button variant="ghost" onClick={() => setShowEditModal(false)}>✕</Button>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Name</label>
                <Input
                  value={editingAnimal.name}
                  onChange={(e) => setEditingAnimal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Animal's name"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Species</label>
                  <select
                    value={editingAnimal.species}
                    onChange={(e) => setEditingAnimal(prev => ({ ...prev, species: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      background: "var(--panel)",
                      color: "var(--text)",
                      fontSize: "14px"
                    }}
                  >
                    {["Cat", "Dog", "Reptile", "Horse", "Pig", "Bird", "Rabbit", "Guinea Pig",
                      "Hamster", "Fish", "Turtle", "Snake", "Lizard", "Ferret", "Chinchilla",
                      "Rat", "Mouse", "Gerbil", "Parrot", "Canary", "Finch", "Duck", "Goose",
                      "Chicken", "Turkey", "Goat", "Sheep", "Cow", "Donkey", "Mule", "Other"].map(species => (
                      <option key={species} value={species}>{species}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Breed</label>
                  <Input
                    value={editingAnimal.breed || ""}
                    onChange={(e) => setEditingAnimal(prev => ({ ...prev, breed: e.target.value }))}
                    placeholder="Breed (optional)"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Age</label>
                  <Input
                    value={editingAnimal.age || ""}
                    onChange={(e) => setEditingAnimal(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Age (e.g., 2 years, 6 months)"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Status</label>
                  <select
                    value={editingAnimal.status}
                    onChange={(e) => setEditingAnimal(prev => ({ ...prev, status: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      background: "var(--panel)",
                      color: "var(--text)",
                      fontSize: "14px"
                    }}
                  >
                    {["active", "completed", "paused", "draft"].map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Fundraising Goal</label>
                  <Input
                    type="number"
                    value={editingAnimal.goal || ""}
                    onChange={(e) => setEditingAnimal(prev => ({ ...prev, goal: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Amount Raised</label>
                  <Input
                    type="number"
                    value={editingAnimal.raised || ""}
                    onChange={(e) => setEditingAnimal(prev => ({ ...prev, raised: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Bio</label>
                <Textarea
                  value={editingAnimal.bio || ""}
                  onChange={(e) => setEditingAnimal(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about this animal..."
                  rows={3}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Story</label>
                <Textarea
                  value={editingAnimal.story || ""}
                  onChange={(e) => setEditingAnimal(prev => ({ ...prev, story: e.target.value }))}
                  placeholder="Share this animal's story..."
                  rows={4}
                />
              </div>

              {/* Profile Image Upload */}
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Profile Photo</label>
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  {editingAnimal.image_url ? (
                    <img 
                      src={editingAnimal.image_url} 
                      alt="Profile" 
                      style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "50%", border: "2px solid var(--border)" }}
                    />
                  ) : (
                    <div style={{
                      width: "100px", 
                      height: "100px", 
                      borderRadius: "50%", 
                      background: "var(--border)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "24px",
                      color: "var(--muted)",
                      border: "2px solid var(--border)"
                    }}>
                      {editingAnimal.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    style={{ position: "absolute", bottom: "0", right: "0" }}
                    onClick={() => document.getElementById('animal-profile-upload').click()}
                  >
                    <Upload size={16}/>
                  </Button>
                  <input
                    id="animal-profile-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleImageUpload('image', e.target.files[0])}
                  />
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Upload a profile photo for {editingAnimal.name}
                </div>
              </div>

              {/* Banner Image Upload */}
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Banner Image</label>
                <div style={{ position: "relative", marginBottom: "12px" }}>
                  {editingAnimal.banner_url ? (
                    <img 
                      src={editingAnimal.banner_url} 
                      alt="Banner" 
                      style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px", border: "2px solid var(--border)" }}
                    />
                  ) : (
                    <div style={{
                      width: "100%", 
                      height: "120px", 
                      borderRadius: "8px", 
                      background: "var(--border)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "16px",
                      color: "var(--muted)",
                      border: "2px solid var(--border)"
                    }}>
                      No banner image set
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    style={{ position: "absolute", top: "8px", right: "8px" }}
                    onClick={() => document.getElementById('animal-banner-upload').click()}
                  >
                    <Upload size={16}/> Change Banner
                  </Button>
                  <input
                    id="animal-banner-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleImageUpload('banner', e.target.files[0])}
                  />
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Upload a banner image for {editingAnimal.name}'s profile
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('animal_profiles')
                    .update({
                      name: editingAnimal.name,
                      species: editingAnimal.species,
                      breed: editingAnimal.breed,
                      age: editingAnimal.age,
                      bio: editingAnimal.bio,
                      story: editingAnimal.story,
                      goal: editingAnimal.goal,
                      raised: editingAnimal.raised,
                      status: editingAnimal.status,
                      image_url: editingAnimal.image_url,
                      banner_url: editingAnimal.banner_url,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', editingAnimal.id);

                  if (error) {
                    console.error('Error updating animal:', error);
                    alert('Failed to update animal profile. Please try again.');
                    return;
                  }

                  // Update local state
                  setAnimal(editingAnimal);
                  setShowEditModal(false);
                  alert('Animal profile updated successfully!');
                } catch (error) {
                  console.error('Error updating animal:', error);
                  alert('Failed to update animal profile. Please try again.');
                }
              }}>
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Customization Modal */}
      {showCustomizeModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <Card style={{
            width: "90%",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflow: "auto",
            padding: "24px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0 }}>Customize {animal?.name}'s Profile</h2>
              <Button variant="ghost" onClick={() => setShowCustomizeModal(false)}>✕</Button>
            </div>

            <div style={{ display: "grid", gap: "24px" }}>
              {/* Color Scheme */}
              <div>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>Color Scheme</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Primary Color</label>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="color"
                        value={customization.primaryColor}
                        onChange={(e) => setCustomization(prev => ({ ...prev, primaryColor: e.target.value }))}
                        style={{ width: "40px", height: "40px", border: "none", borderRadius: "8px", cursor: "pointer" }}
                      />
                      <Input
                        value={customization.primaryColor}
                        onChange={(e) => setCustomization(prev => ({ ...prev, primaryColor: e.target.value }))}
                        placeholder="#FF6FAE"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Secondary Color</label>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="color"
                        value={customization.secondaryColor}
                        onChange={(e) => setCustomization(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        style={{ width: "40px", height: "40px", border: "none", borderRadius: "8px", cursor: "pointer" }}
                      />
                      <Input
                        value={customization.secondaryColor}
                        onChange={(e) => setCustomization(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        placeholder="#e91e63"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Accent Color</label>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="color"
                        value={customization.accentColor}
                        onChange={(e) => setCustomization(prev => ({ ...prev, accentColor: e.target.value }))}
                        style={{ width: "40px", height: "40px", border: "none", borderRadius: "8px", cursor: "pointer" }}
                      />
                      <Input
                        value={customization.accentColor}
                        onChange={(e) => setCustomization(prev => ({ ...prev, accentColor: e.target.value }))}
                        placeholder="#9c27b0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout & Style */}
              <div>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>Layout & Style</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Border Radius</label>
                    <select
                      value={customization.borderRadius}
                      onChange={(e) => setCustomization(prev => ({ ...prev, borderRadius: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        background: "var(--panel)",
                        color: "var(--text)",
                        fontSize: "14px"
                      }}
                    >
                      {["8px", "12px", "16px", "20px", "24px", "32px"].map(radius => (
                        <option key={radius} value={radius}>{radius}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Font Family</label>
                    <select
                      value={customization.fontFamily}
                      onChange={(e) => setCustomization(prev => ({ ...prev, fontFamily: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        background: "var(--panel)",
                        color: "var(--text)",
                        fontSize: "14px"
                      }}
                    >
                      {["system-ui", "Arial", "Helvetica", "Georgia", "Times New Roman", "Verdana", "Segoe UI"].map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Display Options */}
              <div>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>Display Options</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={customization.showProgressBar}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showProgressBar: e.target.checked }))}
                    />
                    Show Fundraising Progress Bar
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={customization.showSocialButtons}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showSocialButtons: e.target.checked }))}
                    />
                    Show Social Media Buttons
                  </label>
                </div>
              </div>

              {/* Widget Management */}
              <div>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>Sidebar Widgets</h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={customization.showProgressBar}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showProgressBar: e.target.checked }))}
                    />
                    Fundraising Progress Bar
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={customization.showRecentDonations}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showRecentDonations: e.target.checked }))}
                    />
                    Recent Donations
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={customization.showTopSupporters}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showTopSupporters: e.target.checked }))}
                    />
                    Top Supporters
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={customization.showFeaturedImage}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showFeaturedImage: e.target.checked }))}
                    />
                    Featured Image
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={customization.showMilestones}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showMilestones: e.target.checked }))}
                    />
                    Milestones
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={customization.showEvents}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showEvents: e.target.checked }))}
                    />
                    Upcoming Events
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={customization.showWishlist}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showWishlist: e.target.checked }))}
                    />
                    Wishlist
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={customization.showPoll}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showPoll: e.target.checked }))}
                    />
                    Community Poll
                  </label>
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>
                  Choose which widgets to display in the sidebar
                </div>
              </div>

              {/* Preview */}
              <div>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "600" }}>Preview</h3>
                <div style={{
                  padding: "20px",
                  border: "2px solid var(--border)",
                  borderRadius: customization.borderRadius,
                  background: customization.backgroundColor,
                  color: customization.textColor,
                  fontFamily: customization.fontFamily,
                  textAlign: "center"
                }}>
                  <div style={{ 
                    width: "100%", 
                    height: "8px", 
                    background: customization.borderColor, 
                    borderRadius: "4px",
                    marginBottom: "16px"
                  }}>
                    <div style={{
                      width: "60%",
                      height: "100%",
                      background: customization.primaryColor,
                      borderRadius: "4px"
                    }} />
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
                    Sample Progress Bar
                  </div>
                  <div style={{ fontSize: "14px", color: customization.textColor, opacity: 0.7 }}>
                    This shows how your colors will look
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
              <Button variant="outline" onClick={() => setShowCustomizeModal(false)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                try {
                  // Save customization to database (you'll need to add a customization table)
                  // For now, we'll just close the modal
                  setShowCustomizeModal(false);
                  alert('Customization saved! (Note: Database integration coming soon)');
                } catch (error) {
                  console.error('Error saving customization:', error);
                  alert('Failed to save customization. Please try again.');
                }
              }}>
                Save Customization
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
