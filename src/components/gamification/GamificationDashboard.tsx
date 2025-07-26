import React, { useState } from 'react';
import { useGamification } from '../../../hooks/useGamification';
import { useWallet } from '../../../lib/WalletProvider';
import { Trophy, Star, Gift, Coins, Calendar } from 'lucide-react';

interface GamificationDashboardProps {
  userAddress: string;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({ userAddress }) => {
    const {
    userStats,
    achievements,
    milestones,
    referralStats,
    stakingRewards,
    seasonalEvents,
    loading,
    error,
    claimReward,
    stakeTokens,
    unstakeTokens
  } = useGamification(userAddress);

  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'rewards' | 'staking' | 'events'>('overview');

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-xl p-6">
        <p className="text-red-400">Error loading gamification data: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Rewards & Achievements
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Star className="w-4 h-4 text-yellow-400" />
          Level {userStats?.level || 1}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: Trophy },
          { id: 'achievements', label: 'Achievements', icon: Star },
          { id: 'rewards', label: 'Rewards', icon: Gift },
          { id: 'staking', label: 'Staking', icon: Coins },
          { id: 'events', label: 'Events', icon: Calendar }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab userStats={userStats} />
      )}

      {activeTab === 'achievements' && (
        <AchievementsTab achievements={achievements} />
      )}

      {activeTab === 'rewards' && (
        <RewardsTab 
          milestones={milestones} 
          referralStats={referralStats}
          onClaimReward={claimReward}
        />
      )}

      {activeTab === 'staking' && (
        <StakingTab 
          stakingRewards={stakingRewards}
          onStake={stakeTokens}
          onUnstake={unstakeTokens}
        />
      )}

      {activeTab === 'events' && (
        <EventsTab seasonalEvents={seasonalEvents} />
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ userStats: any }> = ({ userStats }) => (
  <div className="space-y-6">
    {/* Experience Progress */}
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-medium">Experience Points</span>
        <span className="text-purple-400">{userStats?.experiencePoints || 0} XP</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((userStats?.experiencePoints || 0) % 1000) / 10}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {1000 - ((userStats?.experiencePoints || 0) % 1000)} XP to next level
      </p>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-400">{userStats?.totalEarnings || '0'}</div>
        <div className="text-sm text-gray-400">LIB Earned</div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-400">{userStats?.referralCount || 0}</div>
        <div className="text-sm text-gray-400">Referrals</div>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-yellow-400">{userStats?.achievementCount || 0}</div>
        <div className="text-sm text-gray-400">Achievements</div>
      </div>
    </div>
  </div>
);

// Achievements Tab Component
const AchievementsTab: React.FC<{ achievements: any[] }> = ({ achievements }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements?.map((achievement) => (
        <div 
          key={achievement.id}
          className={`bg-gray-800 rounded-lg p-4 border-2 transition-all ${
            achievement.unlocked 
              ? 'border-yellow-400 bg-yellow-400/10' 
              : 'border-gray-700'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              achievement.unlocked ? 'bg-yellow-400' : 'bg-gray-700'
            }`}>
              <span className="text-2xl">{achievement.icon}</span>
            </div>
            <div>
              <h3 className={`font-medium ${achievement.unlocked ? 'text-yellow-400' : 'text-white'}`}>
                {achievement.name}
              </h3>
              <p className="text-xs text-gray-400">{achievement.description}</p>
            </div>
          </div>
          
          {achievement.progress !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{achievement.progress}/{achievement.target}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-purple-500 h-1 rounded-full transition-all"
                  style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {achievement.reward && (
            <div className="mt-2 text-xs text-green-400">
              Reward: {achievement.reward}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Rewards Tab Component
const RewardsTab: React.FC<{ 
  milestones: any[]; 
  referralStats: any; 
  onClaimReward: (rewardId: string) => Promise<void>;
}> = ({ milestones, referralStats, onClaimReward }) => (
  <div className="space-y-6">
    {/* Milestone Rewards */}
    <div>
      <h3 className="text-lg font-medium text-white mb-4">Milestone Rewards</h3>
      <div className="space-y-3">
        {milestones?.map((milestone) => (
          <div key={milestone.id} className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">{milestone.name}</h4>
                <p className="text-sm text-gray-400">{milestone.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400">{milestone.tokenReward} LIB</span>
                </div>
              </div>
              <div className="text-right">
                {milestone.completed ? (
                  milestone.claimed ? (
                    <span className="text-green-400 text-sm">Claimed</span>
                  ) : (
                    <button
                      onClick={() => onClaimReward(milestone.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Claim Reward
                    </button>
                  )
                ) : (
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      {milestone.progress}/{milestone.target}
                    </div>
                    <div className="w-24 bg-gray-700 rounded-full h-1 mt-1">
                      <div 
                        className="bg-purple-500 h-1 rounded-full"
                        style={{ width: `${(milestone.progress / milestone.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Referral Rewards */}
    <div>
      <h3 className="text-lg font-medium text-white mb-4">Referral Program</h3>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{referralStats?.totalReferrals || 0}</div>
            <div className="text-sm text-gray-400">Total Referrals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{referralStats?.totalEarned || '0'}</div>
            <div className="text-sm text-gray-400">LIB Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{referralStats?.pendingRewards || '0'}</div>
            <div className="text-sm text-gray-400">Pending Rewards</div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Your Referral Code</p>
              <code className="text-purple-400 bg-gray-900 px-2 py-1 rounded text-sm">
                {referralStats?.referralCode || 'Loading...'}
              </code>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(referralStats?.referralCode || '')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Copy Code
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Staking Tab Component
const StakingTab: React.FC<{ 
  stakingRewards: any; 
  onStake: (amount: string) => Promise<void>;
  onUnstake: (amount: string) => Promise<void>;
}> = ({ stakingRewards, onStake, onUnstake }) => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  return (
    <div className="space-y-6">
      {/* Staking Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stakingRewards?.stakedAmount || '0'}</div>
          <div className="text-sm text-gray-400">LIB Staked</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stakingRewards?.pendingRewards || '0'}</div>
          <div className="text-sm text-gray-400">Pending Rewards</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stakingRewards?.votingPower || '0'}</div>
          <div className="text-sm text-gray-400">Voting Power</div>
        </div>
      </div>

      {/* Staking Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stake Tokens */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-4">Stake Tokens</h3>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Amount to stake"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => onStake(stakeAmount)}
              disabled={!stakeAmount || parseFloat(stakeAmount) <= 0}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
            >
              Stake LIB
            </button>
            <p className="text-xs text-gray-400">
              Earn rewards and increase your voting power by staking LIB tokens
            </p>
          </div>
        </div>

        {/* Unstake Tokens */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-4">Unstake Tokens</h3>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Amount to unstake"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => onUnstake(unstakeAmount)}
              disabled={!unstakeAmount || parseFloat(unstakeAmount) <= 0}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
            >
              Unstake LIB
            </button>
            <p className="text-xs text-gray-400">
              Unstaking has a 7-day cooldown period
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Events Tab Component
const EventsTab: React.FC<{ seasonalEvents: any[] }> = ({ seasonalEvents }) => (
  <div className="space-y-4">
    {seasonalEvents?.map((event) => (
      <div key={event.id} className="bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-medium text-white">{event.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs ${
                event.status === 'active' 
                  ? 'bg-green-600 text-white' 
                  : event.status === 'upcoming'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}>
                {event.status}
              </span>
            </div>
            <p className="text-gray-400 mb-3">{event.description}</p>
            
            {/* Event Challenges */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Challenges:</h4>
              {event.challenges?.map((challenge: any, index: number) => (
                <div key={index} className="flex items-center justify-between bg-gray-900 rounded p-2">
                  <span className="text-sm text-gray-300">{challenge.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{challenge.progress}/{challenge.target}</span>
                    <div className="w-16 bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-purple-500 h-1 rounded-full"
                        style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-right ml-4">
            <div className="text-sm text-gray-400">Ends in</div>
            <div className="text-lg font-medium text-white">{event.timeRemaining}</div>
            <div className="text-sm text-green-400 mt-1">
              Reward: {event.reward}
            </div>
          </div>
        </div>
      </div>
    ))}
    
    {(!seasonalEvents || seasonalEvents.length === 0) && (
      <div className="text-center py-8 text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No active events at the moment</p>
        <p className="text-sm">Check back soon for new challenges!</p>
      </div>
    )}
  </div>
);