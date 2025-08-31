import React, { useState, useEffect } from 'react';
import { Button } from './ui.jsx';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import { followService } from '../services/followService.js';
import { useAuth } from '../contexts/useAuth';

export default function FollowButton({ 
  targetUserId, 
  onFollowChange, 
  variant = "default",
  size = "default",
  showIcon = true,
  className = ""
}) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // Don't show follow button if user is not logged in or trying to follow themselves
  if (!user || user.id === targetUserId) {
    return null;
  }

  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const following = await followService.isFollowing(targetUserId);
        setIsFollowing(following);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    const loadFollowerCount = async () => {
      try {
        const count = await followService.getFollowerCount(targetUserId);
        setFollowerCount(count);
      } catch (error) {
        console.error('Error loading follower count:', error);
      }
    };

    checkFollowStatus();
    loadFollowerCount();
  }, [targetUserId]);

  const handleFollowToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollowUser(targetUserId);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        if (onFollowChange) onFollowChange(false);
      } else {
        await followService.followUser(targetUserId);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        if (onFollowChange) onFollowChange(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert the optimistic update
      setIsFollowing(!isFollowing);
      setFollowerCount(prev => isFollowing ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      return isFollowing ? 'Unfollowing...' : 'Following...';
    }
    return isFollowing ? 'Unfollow' : 'Follow';
  };

  const getButtonVariant = () => {
    if (isFollowing) {
      return variant === "outline" ? "outline" : "secondary";
    }
    return variant;
  };

  const getIcon = () => {
    if (!showIcon) return null;
    
    if (isLoading) {
      return <div className="animate-spin" style={{ width: 16, height: 16 }}>⟳</div>;
    }
    
    return isFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Button
        variant={getButtonVariant()}
        size={size}
        onClick={handleFollowToggle}
        disabled={isLoading}
        className={className}
        style={{ 
          minWidth: 'fit-content',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        {getIcon()}
        {getButtonText()}
      </Button>
      
      {/* Follower count display */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        fontSize: '14px',
        color: 'var(--muted-foreground)'
      }}>
        <Users size={14} />
        <span>{followerCount}</span>
      </div>
    </div>
  );
}
