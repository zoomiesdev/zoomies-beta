import { supabase } from '../lib/supabase.js';

export const communityService = {
  // Get all communities with their current statistics
  async getCommunities() {
    try {
      const { data: communities, error } = await supabase
        .from('communities')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Get statistics for each community
      const { data: stats, error: statsError } = await supabase
        .rpc('get_community_stats');
      
      if (statsError) throw statsError;
      
      // Merge communities with their stats
      const communitiesWithStats = communities.map(community => {
        const stat = stats.find(s => s.community_id === community.id);
        return {
          ...community,
          members: stat ? stat.total_members : 0,
          active: stat ? stat.active_members : 0
        };
      });
      
      return { data: communitiesWithStats, error: null };
    } catch (error) {
      console.error('Error fetching communities:', error);
      return { data: [], error };
    }
  },

  // Get communities that a user has joined
  async getUserCommunities(userId) {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          community_id,
          joined_at,
          last_activity,
          communities (
            id,
            name,
            description,
            icon_name
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user communities:', error);
      return { data: [], error };
    }
  },

  // Join a community
  async joinCommunity(userId, communityId) {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .upsert({
          user_id: userId,
          community_id: communityId,
          is_active: true,
          last_activity: new Date().toISOString()
        }, {
          onConflict: 'user_id,community_id'
        });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error joining community:', error);
      return { data: null, error };
    }
  },

  // Leave a community
  async leaveCommunity(userId, communityId) {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .delete()
        .eq('user_id', userId)
        .eq('community_id', communityId);
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error leaving community:', error);
      return { data: null, error };
    }
  },

  // Update user activity in a community
  async updateUserActivity(userId, communityId) {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .update({
          last_activity: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('community_id', communityId);
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating user activity:', error);
      return { data: null, error };
    }
  },

  // Create a post in a community
  async createPost(userId, communityId, postData) {
    try {
      const postPayload = {
        user_id: userId,
        community_id: communityId,
        title: postData.title,
        content: postData.content,
        topic: postData.topic,
        images: postData.images || []
      };
      
      const { data, error } = await supabase
        .from('community_posts')
        .insert(postPayload);
      
      if (error) {
        throw error;
      }
      
      // Update user activity
      if (communityId) {
        await this.updateUserActivity(userId, communityId);
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating post:', error);
      return { data: null, error };
    }
  },

  // Vote on a post
  async voteOnPost(userId, postId, voteType) {
    try {
      const { data, error } = await supabase
        .from('post_votes')
        .upsert({
          user_id: userId,
          post_id: postId,
          vote_type: voteType
        }, {
          onConflict: 'user_id,post_id'
        });

      if (error) throw error;

      // Update post vote counts
      await this.updatePostVoteCounts(postId);

      return { data, error: null };
    } catch (error) {
      console.error('Error voting on post:', error);
      return { data: null, error };
    }
  },

  // Update post vote counts
  async updatePostVoteCounts(postId) {
    try {
      const { data: upvotes } = await supabase
        .from('post_votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('vote_type', 1);

      const { data: downvotes } = await supabase
        .from('post_votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('vote_type', -1);

      const upvoteCount = upvotes?.length || 0;
      const downvoteCount = downvotes?.length || 0;

      await supabase
        .from('community_posts')
        .update({
          upvotes: upvoteCount,
          downvotes: downvoteCount
        })
        .eq('id', postId);

    } catch (error) {
      console.error('Error updating post vote counts:', error);
    }
  },

  // Get user's vote on a post
  async getUserPostVote(userId, postId) {
    try {
      const { data, error } = await supabase
        .from('post_votes')
        .select('vote_type')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return { data: data?.vote_type || 0, error: null };
    } catch (error) {
      console.error('Error getting user post vote:', error);
      return { data: 0, error };
    }
  },

  // Create a comment
  async createComment(userId, postId, content, parentCommentId = null) {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          user_id: userId,
          post_id: postId,
          content: content,
          parent_comment_id: parentCommentId
        });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error creating comment:', error);
      return { data: null, error };
    }
  },

  // Get comments for a post
  async getPostComments(postId) {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_comment_id', null) // Only top-level comments
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get nested comments for each top-level comment
      const commentsWithReplies = await Promise.all(data.map(async (comment) => {
        const { data: replies } = await supabase
          .from('post_comments')
          .select('*')
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true });

        return {
          ...comment,
          replies: replies || []
        };
      }));

      return { data: commentsWithReplies, error: null };
    } catch (error) {
      console.error('Error fetching post comments:', error);
      return { data: [], error };
    }
  },

  // Vote on a comment
  async voteOnComment(userId, commentId, voteType) {
    try {
      const { data, error } = await supabase
        .from('comment_votes')
        .upsert({
          user_id: userId,
          comment_id: commentId,
          vote_type: voteType
        }, {
          onConflict: 'user_id,comment_id'
        });

      if (error) throw error;

      // Update comment vote counts
      await this.updateCommentVoteCounts(commentId);

      return { data, error: null };
    } catch (error) {
      console.error('Error voting on comment:', error);
      return { data: null, error };
    }
  },

  // Update comment vote counts
  async updateCommentVoteCounts(commentId) {
    try {
      const { data: upvotes } = await supabase
        .from('comment_votes')
        .select('vote_type')
        .eq('comment_id', commentId)
        .eq('vote_type', 1);

      const { data: downvotes } = await supabase
        .from('comment_votes')
        .select('vote_type')
        .eq('comment_id', commentId)
        .eq('vote_type', -1);

      const upvoteCount = upvotes?.length || 0;
      const downvoteCount = downvotes?.length || 0;

      await supabase
        .from('post_comments')
        .update({
          upvotes: upvoteCount,
          downvotes: downvoteCount
        })
        .eq('id', commentId);

    } catch (error) {
      console.error('Error updating comment vote counts:', error);
    }
  },

  // Get user's vote on a comment
  async getUserCommentVote(userId, commentId) {
    try {
      const { data, error } = await supabase
        .from('comment_votes')
        .select('vote_type')
        .eq('user_id', userId)
        .eq('comment_id', commentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return { data: data?.vote_type || 0, error: null };
    } catch (error) {
      console.error('Error getting user comment vote:', error);
      return { data: 0, error };
    }
  },

  // Get posts for a specific community
  async getCommunityPosts(communityId, limit = 50) {
    try {
      // First, get the posts without complex joins
      const { data: posts, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (postsError) throw postsError;
      
      // Then, get user data separately
      const enrichedPosts = await Promise.all(posts.map(async (post) => {
        let userData = null;
        
        // Get user data if user_id exists
        if (post.user_id) {
          try {
            const { data: user } = await supabase
              .from('users')
              .select('id, email, full_name, avatar_url')
              .eq('id', post.user_id)
              .single();
            
            if (user) {
              userData = {
                id: user.id,
                email: user.email,
                user_metadata: { 
                  full_name: user.full_name || 'Anonymous User',
                  avatar_url: user.avatar_url
                }
              };
            }
          } catch (err) {
            console.log('Could not fetch user data for post:', post.id);
          }
        }
        
        return {
          ...post,
          user: userData
        };
      }));
      
      return { data: enrichedPosts, error: null };
    } catch (error) {
      console.error('Error fetching community posts:', error);
      return { data: [], error };
    }
  },

  // Get all posts across all communities
  async getAllPosts(limit = 50) {
    try {
      // First, get the posts without complex joins
      const { data: posts, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (postsError) throw postsError;
      
      // Then, get user and community data separately
      const enrichedPosts = await Promise.all(posts.map(async (post) => {
        let userData = null;
        let communityData = null;
        
        // Get user data if user_id exists
        if (post.user_id) {
          try {
            const { data: user } = await supabase
              .from('users')
              .select('id, email, full_name, avatar_url')
              .eq('id', post.user_id)
              .single();
            
            if (user) {
              userData = {
                id: user.id,
                email: user.email,
                user_metadata: { 
                  full_name: user.full_name || 'Anonymous User',
                  avatar_url: user.avatar_url
                }
              };
            }
          } catch (err) {
            console.log('Could not fetch user data for post:', post.id);
          }
        }
        
        // Get community data if community_id exists
        if (post.community_id) {
          try {
            const { data: community } = await supabase
              .from('communities')
              .select('id, name')
              .eq('id', post.community_id)
              .single();
            if (community) {
              communityData = community;
            }
          } catch (err) {
            console.log('Could not fetch community data for post:', post.id);
          }
        }
        
        return {
          ...post,
          user: userData,
          community: communityData
        };
      }));
      
      return { data: enrichedPosts, error: null };
    } catch (error) {
      console.error('Error fetching all posts:', error);
      return { data: [], error };
    }
  },

  // Check if user is member of a community
  async isUserMember(userId, communityId) {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select('id')
        .eq('user_id', userId)
        .eq('community_id', communityId)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      return { data: !!data, error: null };
    } catch (error) {
      console.error('Error checking membership:', error);
      return { data: false, error };
    }
  },

  // Ensure user profile exists (call this when user signs in)
  async ensureUserProfile(userId, userData) {
    try {
      const { data: existingProfile, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (selectError && selectError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userData.email,
            full_name: userData.user_metadata?.full_name || 'Anonymous User',
            avatar_url: userData.user_metadata?.avatar_url || null
          });
        
        if (insertError) throw insertError;
        return { data: true, error: null };
      } else if (selectError) {
        throw selectError;
      } else {
        // Profile exists, update it if needed
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: userData.email,
            full_name: userData.user_metadata?.full_name || 'Anonymous User',
            avatar_url: userData.user_metadata?.avatar_url || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        if (updateError) throw updateError;
        return { data: true, error: null };
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      return { data: false, error };
    }
  }
};
