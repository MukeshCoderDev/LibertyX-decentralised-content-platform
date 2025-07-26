import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from './useContractManager';

interface SocialStats {
  likes: number;
  comments: number;
  shares: number;
  tips: string; // Total tips in LIB
  followers: number;
  isLiked: boolean;
  isFollowing: boolean;
}

interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  totalRewards: string;
  moderationReports: number;
  collaborations: number;
}

export const useSocialFeatures = (contentId?: number, creatorAddress?: string) => {
  const { account, isConnected } = useWallet();
  const { executeTransaction, listenToEvents } = useContractManager();
  
  const [socialStats, setSocialStats] = useState<SocialStats>({
    likes: 0,
    comments: 0,
    shares: 0,
    tips: '0',
    followers: 0,
    isLiked: false,
    isFollowing: false
  });

  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    totalMembers: 0,
    activeMembers: 0,
    totalRewards: '0',
    moderationReports: 0,
    collaborations: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load social stats
  useEffect(() => {
    if (contentId || creatorAddress) {
      loadSocialStats();
      setupEventListeners();
    }
  }, [contentId, creatorAddress, account]);

  const loadSocialStats = async () => {
    try {
      setLoading(true);
      setError(null);

      if (contentId) {
        // Load content-specific stats
        const contentStats = await fetchContentStats(contentId);
        setSocialStats(prev => ({
          ...prev,
          ...contentStats
        }));
      }

      if (creatorAddress) {
        // Load creator-specific stats
        const creatorStats = await fetchCreatorStats(creatorAddress);
        setSocialStats(prev => ({
          ...prev,
          ...creatorStats
        }));

        // Load community stats
        const communityData = await fetchCommunityStats(creatorAddress);
        setCommunityStats(communityData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load social stats');
    } finally {
      setLoading(false);
    }
  };

  const setupEventListeners = () => {
    if (contentId) {
      // Listen for content interactions
      listenToEvents('contentRegistry', 'ContentLiked', (event: any) => {
        if (event.contentId === contentId) {
          setSocialStats(prev => ({
            ...prev,
            likes: event.totalLikes,
            isLiked: event.user.toLowerCase() === account?.toLowerCase() ? event.liked : prev.isLiked
          }));
        }
      });

      listenToEvents('contentRegistry', 'CommentAdded', (event: any) => {
        if (event.contentId === contentId) {
          setSocialStats(prev => ({
            ...prev,
            comments: prev.comments + 1
          }));
        }
      });

      listenToEvents('contentRegistry', 'ContentShared', (event: any) => {
        if (event.contentId === contentId) {
          setSocialStats(prev => ({
            ...prev,
            shares: prev.shares + 1
          }));
        }
      });
    }

    if (creatorAddress) {
      // Listen for creator interactions
      listenToEvents('revenueSplitter', 'TipSent', (event: any) => {
        if (event.creator.toLowerCase() === creatorAddress.toLowerCase()) {
          setSocialStats(prev => ({
            ...prev,
            tips: (parseFloat(prev.tips) + parseFloat(event.amount)).toString()
          }));
        }
      });

      listenToEvents('creatorRegistry', 'CreatorFollowed', (event: any) => {
        if (event.creator.toLowerCase() === creatorAddress.toLowerCase()) {
          setSocialStats(prev => ({
            ...prev,
            followers: event.totalFollowers,
            isFollowing: event.follower.toLowerCase() === account?.toLowerCase() ? event.following : prev.isFollowing
          }));
        }
      });
    }
  };

  // Social actions
  const likeContent = useCallback(async () => {
    if (!isConnected || !account || !contentId) return;

    try {
      await executeTransaction('contentRegistry', 'likeContent', [
        contentId,
        !socialStats.isLiked
      ]);
    } catch (error) {
      console.error('Failed to like content:', error);
      throw error;
    }
  }, [isConnected, account, contentId, socialStats.isLiked, executeTransaction]);

  const shareContent = useCallback(async (platform: string) => {
    if (!isConnected || !account || !contentId) return;

    try {
      await executeTransaction('contentRegistry', 'shareContent', [
        contentId,
        platform
      ]);
    } catch (error) {
      console.error('Failed to share content:', error);
      throw error;
    }
  }, [isConnected, account, contentId, executeTransaction]);

  const followCreator = useCallback(async () => {
    if (!isConnected || !account || !creatorAddress) return;

    try {
      await executeTransaction('creatorRegistry', 'followCreator', [
        creatorAddress,
        !socialStats.isFollowing
      ]);
    } catch (error) {
      console.error('Failed to follow creator:', error);
      throw error;
    }
  }, [isConnected, account, creatorAddress, socialStats.isFollowing, executeTransaction]);

  const tipCreator = useCallback(async (amount: string, message?: string) => {
    if (!isConnected || !account || !creatorAddress) return;

    try {
      await executeTransaction('revenueSplitter', 'tipCreator', [
        creatorAddress,
        amount,
        message || ''
      ]);
    } catch (error) {
      console.error('Failed to tip creator:', error);
      throw error;
    }
  }, [isConnected, account, creatorAddress, executeTransaction]);

  const reportContent = useCallback(async (reportType: string, description: string) => {
    if (!isConnected || !account || !contentId) return;

    try {
      await executeTransaction('libertyDAO', 'submitModerationReport', [
        contentId,
        reportType,
        description,
        [] // evidence array
      ]);
    } catch (error) {
      console.error('Failed to report content:', error);
      throw error;
    }
  }, [isConnected, account, contentId, executeTransaction]);

  // Helper functions to fetch data
  const fetchContentStats = async (contentId: number): Promise<Partial<SocialStats>> => {
    // Mock implementation - would fetch from actual blockchain
    return {
      likes: Math.floor(Math.random() * 1000),
      comments: Math.floor(Math.random() * 100),
      shares: Math.floor(Math.random() * 50),
      isLiked: false
    };
  };

  const fetchCreatorStats = async (creatorAddress: string): Promise<Partial<SocialStats>> => {
    // Mock implementation - would fetch from actual blockchain
    return {
      followers: Math.floor(Math.random() * 10000),
      tips: (Math.random() * 100).toFixed(2),
      isFollowing: false
    };
  };

  const fetchCommunityStats = async (creatorAddress: string): Promise<CommunityStats> => {
    // Mock implementation - would fetch from actual blockchain
    return {
      totalMembers: Math.floor(Math.random() * 5000),
      activeMembers: Math.floor(Math.random() * 500),
      totalRewards: (Math.random() * 1000).toFixed(2),
      moderationReports: Math.floor(Math.random() * 10),
      collaborations: Math.floor(Math.random() * 5)
    };
  };

  return {
    socialStats,
    communityStats,
    loading,
    error,
    actions: {
      likeContent,
      shareContent,
      followCreator,
      tipCreator,
      reportContent,
      refresh: loadSocialStats
    }
  };
};