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

    checkFollowStatus();
  }, [targetUserId]);

  const handleFollowToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollowUser(targetUserId);
        setIsFollowing(false);
        if (onFollowChange) onFollowChange(false);
      } else {
        await followService.followUser(targetUserId);
        setIsFollowing(true);
        if (onFollowChange) onFollowChange(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert the optimistic update
      setIsFollowing(!isFollowing);
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
  );
}
