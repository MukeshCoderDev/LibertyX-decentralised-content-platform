import React, { useState, useEffect } from 'react';
import { Users, Gift, Share2, Copy, Check, Coins, Crown } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';
import { useWallet } from '../lib/WalletProvider';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingRewards: number;
}

export const CommunityRewards: React.FC = () => {
  const { account: _account } = useWallet();
  const { 
    userStats, 
    getReferralLink, 
    isLoading 
  } = useGamification();

  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    pendingRewards: 0
  });

  useEffect(() => {
    // Mock referral stats - in production, this would come from blockchain
    setReferralStats({
      totalReferrals: userStats?.referralCount || 0,
      activeReferrals: Math.floor((userStats?.referralCount || 0) * 0.7),
      totalEarnings: (userStats?.referralCount || 0) * 25, // 25 LIB per referral average
      pendingRewards: Math.floor(Math.random() * 100)
    });
  }, [userStats]);

  const handleCopyReferralLink = async () => {
    const link = getReferralLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShareReferralLink = async () => {
    const link = getReferralLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join LibertyX - Decentralized Content Platform',
          text: 'Join me on LibertyX, the future of decentralized content creation!',
          url: link
        });
      } catch (err) {
        console.error('Failed to share:', err);
      }
    } else {
      handleCopyReferralLink();
    }
  };

  const referralTiers = [
    { min: 0, max: 4, name: 'Newcomer', bonus: '5%', color: 'text-gray-600 bg-gray-100' },
    { min: 5, max: 14, name: 'Advocate', bonus: '10%', color: 'text-blue-600 bg-blue-100' },
    { min: 15, max: 49, name: 'Ambassador', bonus: '15%', color: 'text-purple-600 bg-purple-100' },
    { min: 50, max: 99, name: 'Champion', bonus: '20%', color: 'text-yellow-600 bg-yellow-100' },
    { min: 100, max: Infinity, name: 'Legend', bonus: '25%', color: 'text-red-600 bg-red-100' }
  ];

  const getCurrentTier = () => {
    const referralCount = referralStats.totalReferrals;
    return referralTiers.find(tier => referralCount >= tier.min && referralCount <= tier.max) || referralTiers[0];
  };

  const getNextTier = () => {
    const referralCount = referralStats.totalReferrals;
    return referralTiers.find(tier => referralCount < tier.min);
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

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
        <Users className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Community Rewards</h2>
      </div>

      {/* Referral Program Overview */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold mb-2">Referral Program</h3>
            <p className="text-blue-100">Earn rewards for every friend you bring to LibertyX</p>
          </div>
          <div className="text-right">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${currentTier.color}`}>
              {currentTier.name.toUpperCase()}
            </div>
            <div className="text-sm text-blue-100 mt-1">
              {currentTier.bonus} referral bonus
            </div>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress to {nextTier.name}</span>
              <span>{referralStats.totalReferrals} / {nextTier.min}</span>
            </div>
            <div className="w-full bg-blue-400 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ 
                  width: `${Math.min((referralStats.totalReferrals / nextTier.min) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-blue-600">{referralStats.totalReferrals}</div>
          <p className="text-sm text-gray-600">Total Referrals</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-green-600">{referralStats.activeReferrals}</div>
          <p className="text-sm text-gray-600">Active Users</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-purple-600">{referralStats.totalEarnings}</div>
          <p className="text-sm text-gray-600">LIB Earned</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-yellow-600">{referralStats.pendingRewards}</div>
          <p className="text-sm text-gray-600">Pending LIB</p>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Your Referral Link</h3>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={getReferralLink()}
            readOnly
            className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
          />
          <button
            onClick={handleCopyReferralLink}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleShareReferralLink}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Share this link with friends and earn {currentTier.bonus} of their first purchase in LIB tokens!
        </p>
      </div>

      {/* Referral Tiers */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Referral Tiers</h3>
        <div className="space-y-3">
          {referralTiers.map((tier, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                tier.name === currentTier.name
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Crown className={`w-5 h-5 ${
                  tier.name === currentTier.name ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div>
                  <div className="font-medium">{tier.name}</div>
                  <div className="text-sm text-gray-600">
                    {tier.max === Infinity 
                      ? `${tier.min}+ referrals`
                      : `${tier.min}-${tier.max} referrals`
                    }
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${tier.color}`}>
                {tier.bonus} bonus
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Engagement Rewards */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Community Engagement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Coins className="w-5 h-5 text-green-600" />
              <span className="font-medium">Daily Login Bonus</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Earn 5 LIB tokens for logging in daily
            </p>
            <div className="text-xs text-green-600 font-medium">
              Current streak: 7 days
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Gift className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Content Interaction</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Earn XP for likes, comments, and shares
            </p>
            <div className="text-xs text-purple-600 font-medium">
              +10 XP per interaction
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};