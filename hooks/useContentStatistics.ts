import { useState, useEffect, useCallback, useRef } from 'react';
import { useContractManager } from './useContractManager';
import { useBlockchainEvents } from './useBlockchainEvents';
import { useWallet } from '../lib/WalletProvider';

interface ContentStats {
  contentId: number;
  views: number;
  likes: number;
  earnings: {
    total: string;
    token: string;
  };
  subscribers: number;
  nftHolders: number;
  lastUpdated: number;
}

interface CreatorStats {
  totalViews: number;
  totalEarnings: {
    amount: string;
    token: string;
  }[];
  totalSubscribers: number;
  totalContent: number;
  averageRating: number;
  lastUpdated: number;
}

interface ContentStatisticsHook {
  contentStats: Map<number, ContentStats>;
  creatorStats: CreatorStats | null;
  isLoading: boolean;
  error: string | null;
  refreshContentStats: (contentId: number) => Promise<void>;
  refreshCreatorStats: (creatorAddress: string) => Promise<void>;
  subscribeToContentUpdates: (contentId: number) => void;
  unsubscribeFromContentUpdates: (contentId: number) => void;
}

export const useContentStatistics = (): ContentStatisticsHook => {
  const contractManager = useContractManager();
  const contracts = contractManager?.contracts;
  const { subscribeToEvent, unsubscribeFromEvent } = useBlockchainEvents();
  const { account } = useWallet();
  
  const [contentStats, setContentStats] = useState<Map<number, ContentStats>>(new Map());
  const [creatorStats, setCreatorStats] = useState<CreatorStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const subscribedContent = useRef<Set<number>>(new Set());
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  const refreshContentStats = useCallback(async (contentId: number) => {
    if (!contracts?.contentRegistry || !contracts?.revenueSplitter) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get content info from contract
      const contentInfo = await contracts.contentRegistry.getContent(contentId);
      
      // Get earnings from revenue splitter
      const earnings = await contracts.revenueSplitter.getCreatorEarnings(contentInfo.creator);
      
      // Get subscriber count
      let subscribers = 0;
      if (contracts?.subscriptionManager) {
        try {
          subscribers = await contracts.subscriptionManager.getSubscriberCount(contentInfo.creator);
        } catch (err) {
          console.warn('Failed to get subscriber count:', err);
        }
      }

      // Get NFT holder count
      let nftHolders = 0;
      if (contracts?.nftAccess) {
        try {
          const tierCount = await contracts.nftAccess.getCreatorTierCount(contentInfo.creator);
          for (let i = 0; i < tierCount; i++) {
            const tierInfo = await contracts.nftAccess.getTierInfo(contentInfo.creator, i);
            nftHolders += tierInfo.currentSupply;
          }
        } catch (err) {
          console.warn('Failed to get NFT holder count:', err);
        }
      }

      const stats: ContentStats = {
        contentId,
        views: contentInfo.views || 0,
        likes: contentInfo.likes || 0,
        earnings: {
          total: earnings.toString(),
          token: 'LIB'
        },
        subscribers,
        nftHolders,
        lastUpdated: Date.now()
      };

      setContentStats(prev => new Map(prev.set(contentId, stats)));

    } catch (err) {
      console.error('Error refreshing content stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh stats');
    } finally {
      setIsLoading(false);
    }
  }, [contracts]);

  const refreshCreatorStats = useCallback(async (creatorAddress: string) => {
    if (!contracts?.contentRegistry || !contracts?.revenueSplitter) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get creator info
      const creatorInfo = await contracts.creatorRegistry.getCreator(creatorAddress);
      
      // Get total earnings
      const totalEarnings = await contracts.revenueSplitter.getCreatorEarnings(creatorAddress);
      
      // Get content count
      const contentCount = await contracts.contentRegistry.getCreatorContentCount(creatorAddress);
      
      // Get subscriber count
      let totalSubscribers = 0;
      if (contracts?.subscriptionManager) {
        try {
          totalSubscribers = await contracts.subscriptionManager.getSubscriberCount(creatorAddress);
        } catch (err) {
          console.warn('Failed to get total subscribers:', err);
        }
      }

      // Calculate total views from all content
      let totalViews = 0;
      for (let i = 0; i < contentCount; i++) {
        try {
          const contentId = await contracts.contentRegistry.getCreatorContentId(creatorAddress, i);
          const contentInfo = await contracts.contentRegistry.getContent(contentId);
          totalViews += contentInfo.views || 0;
        } catch (err) {
          console.warn(`Failed to get views for content ${i}:`, err);
        }
      }

      const stats: CreatorStats = {
        totalViews,
        totalEarnings: [{
          amount: totalEarnings.toString(),
          token: 'LIB'
        }],
        totalSubscribers,
        totalContent: contentCount,
        averageRating: 0, // TODO: Implement rating system
        lastUpdated: Date.now()
      };

      setCreatorStats(stats);

    } catch (err) {
      console.error('Error refreshing creator stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh creator stats');
    } finally {
      setIsLoading(false);
    }
  }, [contracts]);

  const subscribeToContentUpdates = useCallback((contentId: number) => {
    if (subscribedContent.current.has(contentId)) {
      return; // Already subscribed
    }

    subscribedContent.current.add(contentId);

    // Subscribe to content-related events
    subscribeToEvent('contentRegistry', 'ContentViewed', (event) => {
      if (event.contentId === contentId) {
        refreshContentStats(contentId);
      }
    });

    subscribeToEvent('contentRegistry', 'ContentLiked', (event) => {
      if (event.contentId === contentId) {
        refreshContentStats(contentId);
      }
    });

    subscribeToEvent('revenueSplitter', 'RevenueDistributed', (event) => {
      // Refresh stats for all content by this creator
      refreshContentStats(contentId);
    });

    subscribeToEvent('subscriptionManager', 'UserSubscribed', (event) => {
      // Refresh stats when someone subscribes
      refreshContentStats(contentId);
    });

    subscribeToEvent('nftAccess', 'NFTMinted', (event) => {
      // Refresh stats when NFT is minted
      refreshContentStats(contentId);
    });

  }, [subscribeToEvent, refreshContentStats]);

  const unsubscribeFromContentUpdates = useCallback((contentId: number) => {
    subscribedContent.current.delete(contentId);
    
    // Note: We don't unsubscribe from individual events here because
    // other content might still need them. The blockchain events hook
    // handles the actual event management.
  }, []);

  // Set up periodic stats refresh
  useEffect(() => {
    updateInterval.current = setInterval(() => {
      // Refresh stats for all subscribed content
      subscribedContent.current.forEach(contentId => {
        refreshContentStats(contentId);
      });

      // Refresh creator stats if we have an account
      if (account) {
        refreshCreatorStats(account);
      }
    }, 30000); // Refresh every 30 seconds

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [refreshContentStats, refreshCreatorStats, account]);

  // Listen for custom events from other parts of the app
  useEffect(() => {
    const handleContentInteraction = (event: CustomEvent) => {
      const { contentId, interactionType, duration } = event.detail;
      if (subscribedContent.current.has(contentId)) {
        refreshContentStats(contentId);
      }
      
      // Track interaction for analytics
      const interaction = {
        contentId,
        interactionType,
        duration,
        timestamp: Date.now(),
        userAddress: account
      };
      
      // Store in local storage for analytics aggregation
      const interactions = JSON.parse(localStorage.getItem('contentInteractions') || '[]');
      interactions.push(interaction);
      
      // Keep only last 1000 interactions
      if (interactions.length > 1000) {
        interactions.splice(0, interactions.length - 1000);
      }
      
      localStorage.setItem('contentInteractions', JSON.stringify(interactions));
    };

    const handleEarningsUpdate = (event: CustomEvent) => {
      const { creatorAddress } = event.detail;
      if (creatorAddress === account) {
        refreshCreatorStats(creatorAddress);
      }
    };

    window.addEventListener('contentViewed', handleContentInteraction as EventListener);
    window.addEventListener('contentLiked', handleContentInteraction as EventListener);
    window.addEventListener('contentInteraction', handleContentInteraction as EventListener);
    window.addEventListener('earningsUpdated', handleEarningsUpdate as EventListener);

    return () => {
      window.removeEventListener('contentViewed', handleContentInteraction as EventListener);
      window.removeEventListener('contentLiked', handleContentInteraction as EventListener);
      window.removeEventListener('contentInteraction', handleContentInteraction as EventListener);
      window.removeEventListener('earningsUpdated', handleEarningsUpdate as EventListener);
    };
  }, [refreshContentStats, refreshCreatorStats, account]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscribedContent.current.clear();
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, []);

  return {
    contentStats,
    creatorStats,
    isLoading,
    error,
    refreshContentStats,
    refreshCreatorStats,
    subscribeToContentUpdates,
    unsubscribeFromContentUpdates
  };
};