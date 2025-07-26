import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, Lock, Unlock, Vote, Calculator } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';
import { useWallet } from '../lib/WalletProvider';

interface StakingPool {
  id: string;
  name: string;
  apy: number;
  lockPeriod: number; // in days
  minStake: number;
  votingPowerMultiplier: number;
  totalStaked: number;
  userStaked: number;
  rewards: number;
}

export const TokenStaking: React.FC = () => {
  const { account } = useWallet();
  const { userStats, stakeTokens, isLoading } = useGamification();
  
  const [selectedPool, setSelectedPool] = useState<string>('flexible');
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [isStaking, setIsStaking] = useState(false);
  const [userBalance, setUserBalance] = useState(1000); // Mock LIB balance

  // Mock staking pools
  const stakingPools: StakingPool[] = [
    {
      id: 'flexible',
      name: 'Flexible Staking',
      apy: 8,
      lockPeriod: 0,
      minStake: 10,
      votingPowerMultiplier: 1,
      totalStaked: 125000,
      userStaked: userStats?.stakingRewards || 0,
      rewards: 0
    },
    {
      id: 'short_term',
      name: '30-Day Lock',
      apy: 12,
      lockPeriod: 30,
      minStake: 50,
      votingPowerMultiplier: 1.5,
      totalStaked: 89000,
      userStaked: 0,
      rewards: 0
    },
    {
      id: 'medium_term',
      name: '90-Day Lock',
      apy: 18,
      lockPeriod: 90,
      minStake: 100,
      votingPowerMultiplier: 2,
      totalStaked: 156000,
      userStaked: 0,
      rewards: 0
    },
    {
      id: 'long_term',
      name: '365-Day Lock',
      apy: 25,
      lockPeriod: 365,
      minStake: 500,
      votingPowerMultiplier: 3,
      totalStaked: 234000,
      userStaked: 0,
      rewards: 0
    }
  ];

  const selectedPoolData = stakingPools.find(pool => pool.id === selectedPool);

  const calculateRewards = (amount: number, apy: number, days: number = 365) => {
    return (amount * apy / 100 * days / 365);
  };

  const handleStake = async () => {
    if (!stakeAmount || !selectedPoolData) return;

    const amount = parseFloat(stakeAmount);
    if (amount < selectedPoolData.minStake || amount > userBalance) return;

    setIsStaking(true);
    try {
      await stakeTokens(amount);
      setStakeAmount('');
      setUserBalance(prev => prev - amount);
    } catch (error) {
      console.error('Staking failed:', error);
    } finally {
      setIsStaking(false);
    }
  };

  const getTotalVotingPower = () => {
    return stakingPools.reduce((total, pool) => {
      return total + (pool.userStaked * pool.votingPowerMultiplier);
    }, 0);
  };

  const getTotalStaked = () => {
    return stakingPools.reduce((total, pool) => total + pool.userStaked, 0);
  };

  const getTotalRewards = () => {
    return stakingPools.reduce((total, pool) => {
      return total + calculateRewards(pool.userStaked, pool.apy, 30); // Monthly rewards
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <Coins className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Token Staking</h2>
      </div>

      {/* Staking Overview */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-4">Your Staking Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{getTotalStaked().toLocaleString()}</div>
            <p className="text-green-100 text-sm">LIB Staked</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{getTotalRewards().toFixed(2)}</div>
            <p className="text-green-100 text-sm">Monthly Rewards</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{getTotalVotingPower().toFixed(1)}</div>
            <p className="text-green-100 text-sm">Voting Power</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{userBalance.toLocaleString()}</div>
            <p className="text-green-100 text-sm">Available LIB</p>
          </div>
        </div>
      </div>

      {/* Staking Pools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stakingPools.map((pool) => (
          <div
            key={pool.id}
            className={`bg-white rounded-xl p-6 border-2 cursor-pointer transition-all ${
              selectedPool === pool.id
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedPool(pool.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{pool.name}</h3>
              <div className="flex items-center space-x-1">
                {pool.lockPeriod > 0 ? (
                  <Lock className="w-4 h-4 text-red-500" />
                ) : (
                  <Unlock className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">APY</span>
                <span className="font-semibold text-green-600">{pool.apy}%</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Lock Period</span>
                <span className="font-semibold">
                  {pool.lockPeriod === 0 ? 'Flexible' : `${pool.lockPeriod} days`}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Min Stake</span>
                <span className="font-semibold">{pool.minStake} LIB</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Voting Power</span>
                <span className="font-semibold">{pool.votingPowerMultiplier}x</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Your Stake</span>
                <span className="font-semibold">{pool.userStaked.toLocaleString()} LIB</span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500 mb-1">Total Pool Size</div>
                <div className="text-sm font-medium">{pool.totalStaked.toLocaleString()} LIB</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Staking Interface */}
      {selectedPoolData && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">
            Stake in {selectedPoolData.name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Stake (LIB)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder={`Min: ${selectedPoolData.minStake} LIB`}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={selectedPoolData.minStake}
                  max={userBalance}
                />
                <button
                  onClick={() => setStakeAmount(userBalance.toString())}
                  className="absolute right-2 top-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  MAX
                </button>
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                Available: {userBalance.toLocaleString()} LIB
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Calculator className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Estimated Returns:</span>
              </div>
              
              {stakeAmount && parseFloat(stakeAmount) >= selectedPoolData.minStake && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Daily Rewards:</span>
                    <span className="font-medium">
                      {calculateRewards(parseFloat(stakeAmount), selectedPoolData.apy, 1).toFixed(4)} LIB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Rewards:</span>
                    <span className="font-medium">
                      {calculateRewards(parseFloat(stakeAmount), selectedPoolData.apy, 30).toFixed(2)} LIB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Yearly Rewards:</span>
                    <span className="font-medium text-green-600">
                      {calculateRewards(parseFloat(stakeAmount), selectedPoolData.apy).toFixed(2)} LIB
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Voting Power:</span>
                    <span className="font-medium text-blue-600">
                      {(parseFloat(stakeAmount) * selectedPoolData.votingPowerMultiplier).toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleStake}
              disabled={
                !stakeAmount || 
                parseFloat(stakeAmount) < selectedPoolData.minStake || 
                parseFloat(stakeAmount) > userBalance ||
                isStaking
              }
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isStaking ? 'Staking...' : 'Stake Tokens'}
            </button>
            
            {selectedPoolData.userStaked > 0 && (
              <button className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
                Unstake
              </button>
            )}
          </div>

          {selectedPoolData.lockPeriod > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 font-medium">
                  Lock Period: {selectedPoolData.lockPeriod} days
                </span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Your tokens will be locked for {selectedPoolData.lockPeriod} days after staking.
                Early withdrawal may incur penalties.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Voting Power Benefits */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center space-x-2 mb-4">
          <Vote className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Voting Power Benefits</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium mb-1">Governance Participation</h4>
            <p className="text-sm text-gray-600">
              Vote on platform proposals and shape the future of LibertyX
            </p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Coins className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium mb-1">Revenue Sharing</h4>
            <p className="text-sm text-gray-600">
              Higher voting power means larger share of platform revenue
            </p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Lock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium mb-1">Exclusive Access</h4>
            <p className="text-sm text-gray-600">
              Unlock premium features and early access to new tools
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};