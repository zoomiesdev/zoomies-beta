import { supabase } from '../lib/supabase.js';

export const followService = {
  // Follow a user
  async followUser(followingId, userId) {
    try {
      const { data, error } = await supabase
        .from('follows')
        .insert({
          follower_id: userId,
          following_id: followingId
        })
        .select()
        .single();

      if (error) {
        console.error('Error following user:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in followUser:', error);
      throw error;
    }
  },

  // Unfollow a user
  async unfollowUser(followingId, userId) {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', followingId);

      if (error) {
        console.error('Error unfollowing user:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in unfollowUser:', error);
      throw error;
    }
  },

  // Check if current user is following another user
  async isFollowing(followingId, userId) {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking follow status:', error);
        throw error;
      }

      return !!data; // Return true if data exists, false otherwise
    } catch (error) {
      console.error('Error in isFollowing:', error);
      return false;
    }
  },

  // Get follower count for a user
  async getFollowerCount(userId) {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (error) {
        console.error('Error getting follower count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting follower count:', error);
      return 0;
    }
  },

  // Get following count for a user
  async getFollowingCount(userId) {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (error) {
        console.error('Error getting following count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting following count:', error);
      return 0;
    }
  },

  // Get followers list for a user
  async getFollowers(userId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          created_at,
          follower:follows_follower_id_fkey(
            id,
            user_profiles!inner(
              full_name,
              avatar_url
            )
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting followers:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  },

  // Get following list for a user
  async getFollowing(userId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          created_at,
          following:follows_following_id_fkey(
            id,
            user_profiles!inner(
              full_name,
              avatar_url
            )
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting following:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  }
};
