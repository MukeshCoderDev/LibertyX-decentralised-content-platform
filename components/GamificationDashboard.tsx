import React, { useState, useEffect } from 'react';
import { Trophy, Star, Gift, Target, Zap, Crown, Users, Coins } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';
import { useWallet } from '../lib/WalletProvider';
import { CreatorGoals } from './CreatorGoals';
import { CommunityRewards } from './CommunityRewards';
import { TokenStaking } from './TokenStaking';
import { SeasonalEvents } from './SeasonalEvents';

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

export const GamificationDashboard: React.FC = () => {
  const { account } = useWallet();
  const {
    userStats,
    achievements,
    claimReward,
    getSeasonalEvents,
    getReferralLink,
    isLoading
  } = useGamification();

  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'rewards' | 'events' | 'goals' | 'community' | 'staking'>('overview');
  const [seasonalEvents, setSeasonalEvents] = useState([]);
  const [isComponentMounted, setIsComponentMounted] = useState(false);

  useEffect(() => {
    setIsComponentMounted(true);
    
    if (account) {
      // Use setTimeout to prevent blocking the main thread
      const timeoutId = setTimeout(() => {
        loadSeasonalEvents();
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        setIsComponentMounted(false);
      };
    }
    
    return () => setIsComponentMounted(false);
  }, [account]);

  const loadSeasonalEvents = async () => {
    try {
      const events = await getSeasonalEvents();
      setSeasonalEvents(events);
    } catch (error) {
      console.error('Failed to load seasonal events:', error);
      // Set empty array to prevent infinite loading
      setSeasonalEvents([]);
    }
  };

  const handleClaimReward = async (achievementId: string) => {
    try {
      await claimReward(achievementId);
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  const getLoyaltyTierColor = (tier: string) => {
    const colors = {
      bronze: 'text-amber-600 bg-amber-100',
      silver: 'text-gray-600 bg-gray-100',
      gold: 'text-yellow-600 bg-yellow-100',
      platinum: 'text-purple-600 bg-purple-100',
      diamond: 'text-blue-600 bg-blue-100'
    };
    return colors[tier as keyof typeof colors] || colors.bronze;
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'border-gray-300 bg-gray-50',
      rare: 'border-blue-300 bg-blue-50',
      epic: 'border-purple-300 bg-purple-50',
      legendary: 'border-yellow-300 bg-yellow-50'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  if (isLoading || !isComponentMounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gamification Hub</h1>
            <p className="text-purple-100">Level up your LibertyX experience</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">Level {userStats?.level || 1}</div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getLoyaltyTierColor(userStats?.loyaltyTier || 'bronze')}`}>
              {userStats?.loyaltyTier?.toUpperCase() || 'BRONZE'} TIER
            </div>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>XP Progress</span>
            <span>{userStats?.xp || 0} / {userStats?.xpToNextLevel || 1000}</span>
          </div>
          <div className="w-full bg-purple-400 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${((userStats?.xp || 0) / (userStats?.xpToNextLevel || 1000)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: Trophy },
          { id: 'achievements', label: 'Achievements', icon: Star },
          { id: 'goals', label: 'Creator Goals', icon: Target },
          { id: 'community', label: 'Community', icon: Users },
          { id: 'staking', label: 'Staking', icon: Coins },
          { id: 'rewards', label: 'Rewards', icon: Gift },
          { id: 'events', label: 'Events', icon: Target }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab(id as any);
            }}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors text-sm ${
              activeTab === id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total XP</p>
                <p className="text-2xl font-bold">{userStats?.totalXp?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Achievements</p>
                <p className="text-2xl font-bold">{userStats?.achievements?.filter(a => a.completed).length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Referrals</p>
                <p className="text-2xl font-bold">{userStats?.referralCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements?.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-xl border-2 ${getRarityColor(achievement.rarity)} ${
                achievement.completed ? 'opacity-100' : 'opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <h3 className="font-semibold">{achievement.name}</h3>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        +{achievement.reward.xp} XP
                      </span>
                      {achievement.reward.tokens > 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          +{achievement.reward.tokens} LIB
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {achievement.completed && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClaimReward(achievement.id);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Claim
                  </button>
                )}
              </div>
              
              {!achievement.completed && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{achievement.progress} / {achievement.maxProgress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                      style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* Referral System */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-xl font-bold mb-4">Referral Program</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 mb-4">
                  Invite friends and earn 10% of their first purchase in LIB tokens!
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={getReferralLink()}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigator.clipboard.writeText(getReferralLink());
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{userStats?.referralCount || 0}</div>
                <p className="text-gray-600">Successful Referrals</p>
              </div>
            </div>
          </div>

          {/* Staking Rewards */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-xl font-bold mb-4">Staking Rewards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{userStats?.stakingRewards || 0}</div>
                <p className="text-sm text-gray-600">LIB Staked</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">12%</div>
                <p className="text-sm text-gray-600">APY</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">2.5x</div>
                <p className="text-sm text-gray-600">Voting Power</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'goals' && <CreatorGoals />}

      {activeTab === 'community' && <CommunityRewards />}

      {activeTab === 'staking' && <TokenStaking />}

      {activeTab === 'events' && <SeasonalEvents />}
    </div>
  );
};