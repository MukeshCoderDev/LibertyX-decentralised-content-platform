import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from './useContractManager';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  completed: boolean;
  reward: {
    xp: number;
    tokens: number;
    badge?: string;
  };
}

interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXp: number;
  achievements: Achievement[];
  badges: string[];
  referralCount: number;
  stakingRewards: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  timeRemaining: string;
  challenges: Challenge[];
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  progress: number;
  reward: string;
}

interface CreatorGoal {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  reward: {
    featureUnlock?: string;
    revenueShareIncrease?: number;
    tokens?: number;
  };
  completed: boolean;
}

export const useGamification = () => {
  const { account } = useWallet();
  const { contracts } = useContractManager();
  
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [creatorGoals, setCreatorGoals] = useState<CreatorGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // XP calculation constants
  const XP_PER_LEVEL = 1000;
  const LEVEL_MULTIPLIER = 1.2;

  // Achievement definitions
  const achievementDefinitions: Omit<Achievement, 'progress' | 'completed'>[] = [
    {
      id: 'first_upload',
      name: 'Content Creator',
      description: 'Upload your first piece of content',
      icon: '🎬',
      rarity: 'common',
      maxProgress: 1,
      reward: { xp: 100, tokens: 10 }
    },
    {
      id: 'subscriber_milestone_10',
      name: 'Rising Star',
      description: 'Reach 10 subscribers',
      icon: '⭐',
      rarity: 'common',
      maxProgress: 10,
      reward: { xp: 250, tokens: 25 }
    },
    {
      id: 'subscriber_milestone_100',
      name: 'Popular Creator',
      description: 'Reach 100 subscribers',
      icon: '🌟',
      rarity: 'rare',
      maxProgress: 100,
      reward: { xp: 500, tokens: 100 }
    },
    {
      id: 'subscriber_milestone_1000',
      name: 'Influencer',
      description: 'Reach 1,000 subscribers',
      icon: '💫',
      rarity: 'epic',
      maxProgress: 1000,
      reward: { xp: 1000, tokens: 500 }
    },
    {
      id: 'earnings_milestone_100',
      name: 'Entrepreneur',
      description: 'Earn 100 LIB tokens',
      icon: '💰',
      rarity: 'rare',
      maxProgress: 100,
      reward: { xp: 300, tokens: 50 }
    },
    {
      id: 'nft_creator',
      name: 'NFT Pioneer',
      description: 'Create your first NFT tier',
      icon: '🎨',
      rarity: 'rare',
      maxProgress: 1,
      reward: { xp: 400, tokens: 75 }
    },
    {
      id: 'dao_participant',
      name: 'Governance Guru',
      description: 'Vote on 5 DAO proposals',
      icon: '🗳️',
      rarity: 'epic',
      maxProgress: 5,
      reward: { xp: 600, tokens: 200 }
    },
    {
      id: 'referral_master',
      name: 'Community Builder',
      description: 'Refer 10 new users',
      icon: '🤝',
      rarity: 'epic',
      maxProgress: 10,
      reward: { xp: 800, tokens: 300 }
    },
    {
      id: 'content_marathon',
      name: 'Content Machine',
      description: 'Upload 50 pieces of content',
      icon: '🚀',
      rarity: 'legendary',
      maxProgress: 50,
      reward: { xp: 2000, tokens: 1000, badge: 'legendary_creator' }
    }
  ];

  // Creator goal definitions
  const creatorGoalDefinitions: Omit<CreatorGoal, 'currentValue' | 'completed'>[] = [
    {
      id: 'monthly_earnings_100',
      name: 'Monthly Milestone',
      description: 'Earn 100 LIB tokens in a month',
      targetValue: 100,
      reward: { revenueShareIncrease: 2, tokens: 50 }
    },
    {
      id: 'subscriber_growth_50',
      name: 'Growth Target',
      description: 'Gain 50 new subscribers this month',
      targetValue: 50,
      reward: { featureUnlock: 'advanced_analytics', tokens: 100 }
    },
    {
      id: 'content_consistency_20',
      name: 'Consistency Champion',
      description: 'Upload 20 pieces of content this month',
      targetValue: 20,
      reward: { featureUnlock: 'priority_support', tokens: 75 }
    }
  ];

  // Calculate level from XP
  const calculateLevel = (totalXp: number): { level: number; xpToNextLevel: number } => {
    let level = 1;
    let xpRequired = XP_PER_LEVEL;
    let totalXpRequired = 0;

    while (totalXp >= totalXpRequired + xpRequired) {
      totalXpRequired += xpRequired;
      level++;
      xpRequired = Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1));
    }

    const xpToNextLevel = totalXpRequired + xpRequired - totalXp;
    return { level, xpToNextLevel };
  };

  // Calculate loyalty tier
  const calculateLoyaltyTier = (totalXp: number, stakingAmount: number): UserStats['loyaltyTier'] => {
    const score = totalXp + (stakingAmount * 10);
    
    if (score >= 50000) return 'diamond';
    if (score >= 25000) return 'platinum';
    if (score >= 10000) return 'gold';
    if (score >= 5000) return 'silver';
    return 'bronze';
  };

  // Load user stats and achievements
  const loadUserData = useCallback(async () => {
    if (!account || !contracts) return;

    setIsLoading(true);
    setError(null);

    try {
      // Mock data for now - in production, this would come from blockchain/backend
      const mockUserData = {
        totalXp: 2500,
        referralCount: 3,
        stakingRewards: 500,
        badges: ['early_adopter'],
        achievementProgress: {
          first_upload: 1,
          subscriber_milestone_10: 8,
          subscriber_milestone_100: 45,
          earnings_milestone_100: 75,
          nft_creator: 0,
          dao_participant: 2,
          referral_master: 3,
          content_marathon: 12
        }
      };

      const { level, xpToNextLevel } = calculateLevel(mockUserData.totalXp);
      const loyaltyTier = calculateLoyaltyTier(mockUserData.totalXp, mockUserData.stakingRewards);

      // Build achievements with progress
      const userAchievements = achievementDefinitions.map(achievement => ({
        ...achievement,
        progress: mockUserData.achievementProgress[achievement.id as keyof typeof mockUserData.achievementProgress] || 0,
        completed: (mockUserData.achievementProgress[achievement.id as keyof typeof mockUserData.achievementProgress] || 0) >= achievement.maxProgress
      }));

      setUserStats({
        level,
        xp: mockUserData.totalXp - (level - 1) * XP_PER_LEVEL,
        xpToNextLevel,
        totalXp: mockUserData.totalXp,
        achievements: userAchievements,
        badges: mockUserData.badges,
        referralCount: mockUserData.referralCount,
        stakingRewards: mockUserData.stakingRewards,
        loyaltyTier
      });

      setAchievements(userAchievements);

      // Load creator goals with mock progress
      const userCreatorGoals = creatorGoalDefinitions.map(goal => ({
        ...goal,
        currentValue: Math.floor(Math.random() * goal.targetValue),
        completed: Math.random() > 0.7
      }));

      setCreatorGoals(userCreatorGoals);

    } catch (err) {
      console.error('Failed to load user gamification data:', err);
      setError('Failed to load gamification data');
    } finally {
      setIsLoading(false);
    }
  }, [account, contracts]);

  // Award XP for actions
  const awardXP = useCallback(async (action: string, amount: number) => {
    if (!account) return;

    try {
      // In production, this would update blockchain state
      console.log(`Awarding ${amount} XP for action: ${action}`);
      
      // Update local state
      setUserStats(prev => {
        if (!prev) return prev;
        
        const newTotalXp = prev.totalXp + amount;
        const { level, xpToNextLevel } = calculateLevel(newTotalXp);
        const loyaltyTier = calculateLoyaltyTier(newTotalXp, prev.stakingRewards);

        return {
          ...prev,
          totalXp: newTotalXp,
          level,
          xp: newTotalXp - (level - 1) * XP_PER_LEVEL,
          xpToNextLevel,
          loyaltyTier
        };
      });

    } catch (err) {
      console.error('Failed to award XP:', err);
    }
  }, [account]);

  // Claim achievement reward
  const claimReward = useCallback(async (achievementId: string) => {
    if (!account) return;

    try {
      const achievement = achievements.find(a => a.id === achievementId);
      if (!achievement || !achievement.completed) return;

      // In production, this would interact with smart contracts
      console.log(`Claiming reward for achievement: ${achievementId}`);
      
      // Award XP and tokens
      await awardXP('achievement_claim', achievement.reward.xp);
      
      // Update achievement as claimed
      setAchievements(prev => 
        prev.map(a => 
          a.id === achievementId 
            ? { ...a, claimed: true }
            : a
        )
      );

    } catch (err) {
      console.error('Failed to claim reward:', err);
      throw err;
    }
  }, [account, achievements, awardXP]);

  // Get seasonal events
  const getSeasonalEvents = useCallback(async (): Promise<SeasonalEvent[]> => {
    // Mock seasonal events - in production, this would come from backend
    const mockEvents: SeasonalEvent[] = [
      {
        id: 'winter_challenge_2024',
        name: 'Winter Creator Challenge',
        description: 'Special winter-themed content creation event',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-31'),
        timeRemaining: '15 days',
        challenges: [
          {
            id: 'winter_uploads',
            name: 'Winter Content',
            description: 'Upload 10 winter-themed videos',
            progress: 60,
            reward: '500 LIB + Winter Badge'
          },
          {
            id: 'holiday_collaboration',
            name: 'Holiday Collab',
            description: 'Collaborate with 3 other creators',
            progress: 33,
            reward: '300 LIB + Collaboration Badge'
          }
        ]
      }
    ];

    return mockEvents;
  }, []);

  // Get referral link
  const getReferralLink = useCallback(() => {
    if (!account) return '';
    return `https://libertyx.io/ref/${account.slice(0, 8)}`;
  }, [account]);

  // Stake tokens for rewards
  const stakeTokens = useCallback(async (amount: number) => {
    if (!account || !contracts) return;

    try {
      setIsLoading(true);
      
      // In production, this would interact with staking contract
      console.log(`Staking ${amount} LIB tokens`);
      
      // Update staking rewards
      setUserStats(prev => {
        if (!prev) return prev;
        
        const newStakingRewards = prev.stakingRewards + amount;
        const loyaltyTier = calculateLoyaltyTier(prev.totalXp, newStakingRewards);
        
        return {
          ...prev,
          stakingRewards: newStakingRewards,
          loyaltyTier
        };
      });

    } catch (err) {
      console.error('Failed to stake tokens:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [account, contracts]);

  // Process referral
  const processReferral = useCallback(async (referredAddress: string) => {
    if (!account) return;

    try {
      // In production, this would interact with smart contracts
      console.log(`Processing referral for: ${referredAddress}`);
      
      // Award referral bonus (10% of first purchase)
      await awardXP('referral_bonus', 200);
      
      // Update referral count
      setUserStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          referralCount: prev.referralCount + 1
        };
      });

    } catch (err) {
      console.error('Failed to process referral:', err);
      throw err;
    }
  }, [account, awardXP]);

  // Update creator goal progress
  const updateCreatorGoalProgress = useCallback(async (goalId: string, progress: number) => {
    setCreatorGoals(prev => 
      prev.map(goal => 
        goal.id === goalId 
          ? { 
              ...goal, 
              currentValue: Math.min(progress, goal.targetValue),
              completed: progress >= goal.targetValue
            }
          : goal
      )
    );
  }, []);

  // Load data on mount and account change
  useEffect(() => {
    if (account && contracts) {
      // Use setTimeout to prevent blocking the main thread
      const timeoutId = setTimeout(() => {
        loadUserData();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [account, contracts]); // Remove loadUserData from dependencies to prevent infinite loops

  return {
    userStats,
    achievements,
    creatorGoals,
    isLoading,
    error,
    awardXP,
    claimReward,
    getSeasonalEvents,
    getReferralLink,
    stakeTokens,
    processReferral,
    updateCreatorGoalProgress,
    refreshData: loadUserData
  };
};