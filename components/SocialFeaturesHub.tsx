import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { CommentSystem } from './CommentSystem';
import { LiveStreamChat } from './LiveStreamChat';
import { CreatorCollaboration } from './CreatorCollaboration';
import { CommunityRewards } from './CommunityRewards';
import { CommunityIntegration } from './CommunityIntegration';
import { DecentralizedModeration } from './DecentralizedModeration';
import { Users, MessageSquare, Gift, Shield, Zap, Crown } from 'lucide-react';

interface SocialFeaturesHubProps {
  contentId?: number;
  creatorAddress?: string;
  streamId?: string;
  isLive?: boolean;
  viewerCount?: number;
  className?: string;
}

export const SocialFeaturesHub: React.FC<SocialFeaturesHubProps> = ({
  contentId,
  creatorAddress,
  streamId,
  isLive = false,
  viewerCount = 0,
  className = ''
}) => {
  const { account, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<'comments' | 'chat' | 'collaboration' | 'rewards' | 'community' | 'moderation'>('comments');
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (account && creatorAddress) {
      setIsCreator(account.toLowerCase() === creatorAddress.toLowerCase());
    }
  }, [account, creatorAddress]);

  const tabs = [
    {
      id: 'comments' as const,
      label: 'Comments',
      icon: MessageSquare,
      show: !!contentId,
      badge: null
    },
    {
      id: 'chat' as const,
      label: 'Live Chat',
      icon: Zap,
      show: !!streamId && isLive,
      badge: viewerCount > 0 ? viewerCount.toString() : null
    },
    {
      id: 'collaboration' as const,
      label: 'Collaborate',
      icon: Users,
      show: isConnected && !!creatorAddress,
      badge: null
    },
    {
      id: 'rewards' as const,
      label: 'Rewards',
      icon: Gift,
      show: isConnected,
      badge: null
    },
    {
      id: 'community' as const,
      label: 'Community',
      icon: Crown,
      show: !!creatorAddress,
      badge: null
    },
    {
      id: 'moderation' as const,
      label: 'Moderation',
      icon: Shield,
      show: isConnected,
      badge: null
    }
  ].filter(tab => tab.show);

  // Auto-select appropriate tab based on context
  useEffect(() => {
    if (streamId && isLive && tabs.some(t => t.id === 'chat')) {
      setActiveTab('chat');
    } else if (contentId && tabs.some(t => t.id === 'comments')) {
      setActiveTab('comments');
    } else if (tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [streamId, isLive, contentId, tabs]);

  if (!isConnected && !contentId) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 text-center ${className}`}>
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Join the Community</h3>
        <p className="text-gray-600 mb-4">
          Connect your wallet to access social features, earn rewards, and engage with creators.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Comments & Reactions</span>
          </div>
          <div className="flex items-center space-x-2">
            <Gift className="w-4 h-4" />
            <span>Community Rewards</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Creator Collaboration</span>
          </div>
          <div className="flex items-center space-x-2">
            <Crown className="w-4 h-4" />
            <span>Community Access</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Content Moderation</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Live Chat</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
      {/* Tab Navigation */}
      {tabs.length > 1 && (
        <div className="border-b bg-gray-50">
          <nav className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'comments' && contentId && (
          <CommentSystem
            contentId={contentId}
            creatorAddress={creatorAddress || ''}
          />
        )}

        {activeTab === 'chat' && streamId && (
          <LiveStreamChat
            streamId={streamId}
            creatorAddress={creatorAddress || ''}
            isLive={isLive}
            viewerCount={viewerCount}
          />
        )}

        {activeTab === 'collaboration' && creatorAddress && (
          <div className="p-6">
            <CreatorCollaboration
              creatorAddress={creatorAddress}
            />
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="p-6">
            <CommunityRewards
              userAddress={account || undefined}
            />
          </div>
        )}

        {activeTab === 'community' && creatorAddress && (
          <div className="p-6">
            <CommunityIntegration
              creatorAddress={creatorAddress}
              isCreator={isCreator}
            />
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="p-6">
            <DecentralizedModeration />
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="border-t bg-gray-50 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            {isConnected && (
              <>
                <span>Connected: {account?.slice(0, 6)}...{account?.slice(-4)}</span>
                {creatorAddress && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    isCreator ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isCreator ? 'Creator' : 'Fan'}
                  </span>
                )}
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {streamId && isLive && (
              <div className="flex items-center space-x-1 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">LIVE</span>
              </div>
            )}
            
            {viewerCount > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{viewerCount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};