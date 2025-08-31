import React, { useState, useEffect } from 'react';
import { Button } from './ui.jsx';
import { UserPlus, UserMinus } from 'lucide-react';
import { followService } from '../services/followService.js';
import { useAuth } from '../contexts/useAuth';

export default function FollowButton({ 
  targetUserId, 
  onFollowChange, 
  variant = "default",
  size = "default",
  showIcon = true,
  className = "",
  compact = false // New prop for compact/icon-only mode
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
        const following = await followService.isFollowing(targetUserId, user.id);
        setIsFollowing(following);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [targetUserId, user.id]);

  const handleFollowToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollowUser(targetUserId, user.id);
        setIsFollowing(false);
        if (onFollowChange) onFollowChange(false);
      } else {
        await followService.followUser(targetUserId, user.id);
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

  const Icon = isFollowing ? UserMinus : UserPlus;
  const text = isFollowing ? 'Unfollow' : 'Follow';
  const tooltipText = isFollowing ? 'Unfollow' : 'Follow';

  if (compact) {
    // Compact icon-only mode for community use
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleFollowToggle}
        disabled={isLoading}
        className={className}
        style={{ 
          padding: '3px',
          minWidth: 'auto',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={tooltipText} // Hover tooltip
      >
        {isLoading ? (
          <div className="animate-spin" style={{ width: 12, height: 12 }}>⟳</div>
        ) : (
          <Icon size={12} />
        )}
      </Button>
    );
  }

  // Regular mode with text and icon
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={className}
    >
      {showIcon && <Icon className="mr-2 h-4 w-4" />}
      {text}
    </Button>
  );
}
