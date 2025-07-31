import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { MessageSquare, Users, Settings, ExternalLink } from 'lucide-react';

interface CommunityChannel {
  id: string;
  platform: 'discord' | 'telegram';
  name: string;
  description: string;
  memberCount: number;
  isConnected: boolean;
  inviteLink?: string;
  webhookUrl?: string;
  botToken?: string;
  creatorAddress: string;
  accessLevel: 'public' | 'subscribers' | 'nft_holders' | 'premium';
  requiredNftTier?: number;
  createdAt: number;
}

interface CommunityIntegrationProps {
  creatorAddress: string;
  isCreator?: boolean;
  className?: string;
}

export const CommunityIntegration: React.FC<CommunityIntegrationProps> = ({
  creatorAddress,
  isCreator = false,
  className = ''
}) => {
  const { account, isConnected } = useWallet();
  const { executeTransaction } = useContractManager();
  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'discord' | 'telegram'>('discord');
  const [newChannel, setNewChannel] = useState({
    name: '',
    description: '',
    accessLevel: 'subscribers' as CommunityChannel['accessLevel'],
    requiredNftTier: 1,
    inviteLink: '',
    webhookUrl: '',
    botToken: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunityChannels();
  }, [creatorAddress]);

  const loadCommunityChannels = async () => {
    try {
      setLoading(true);
      // Load community channels from blockchain or API
      const channelsData = await fetchCommunityChannelsFromChain();
      setChannels(channelsData);
    } catch (error) {
      console.error('Failed to load community channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCommunityChannel = async () => {
    if (!isConnected || !account || !isCreator) return;

    try {
      // Store community channel info on-chain
      await executeTransaction('creatorRegistry', 'addCommunityChannel', [
        selectedPlatform,
        newChannel.name,
        newChannel.description,
        newChannel.accessLevel,
        newChannel.requiredNftTier || 0,
        newChannel.inviteLink
      ]);

      // Set up webhook integration
      if (newChannel.webhookUrl) {
        await setupWebhookIntegration(selectedPlatform, newChannel.webhookUrl);
      }

      setShowCreateModal(false);
      resetNewChannel();
      await loadCommunityChannels();
    } catch (error) {
      console.error('Failed to create community channel:', error);
    }
  };

  const setupWebhookIntegration = async (platform: string, webhookUrl: string) => {
    try {
      // Configure webhook for platform notifications
      const response = await fetch('/api/community/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          webhookUrl,
          creatorAddress,
          events: ['new_content', 'live_stream', 'milestone']
        })
      });

      if (!response.ok) {
        throw new Error('Failed to setup webhook');
      }
    } catch (error) {
      console.error('Webhook setup failed:', error);
    }
  };

  const joinCommunity = async (channelId: string) => {
    if (!isConnected || !account) return;

    try {
      // Verify user access level
      const hasAccess = await verifyUserAccess(channelId);
      if (!hasAccess) {
        alert('You do not have access to this community. Please check the requirements.');
        return;
      }

      const channel = channels.find(c => c.id === channelId);
      if (channel?.inviteLink) {
        window.open(channel.inviteLink, '_blank');
      }
    } catch (error) {
      console.error('Failed to join community:', error);
    }
  };

  const verifyUserAccess = async (channelId: string): Promise<boolean> => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return false;

    switch (channel.accessLevel) {
      case 'public':
        return true;
      case 'subscribers':
        // Check if user is subscribed
        return await checkSubscriptionStatus(channel.creatorAddress);
      case 'nft_holders':
        // Check if user holds required NFT
        return await checkNftOwnership(channel.creatorAddress, channel.requiredNftTier);
      case 'premium':
        // Check premium access
        return await checkPremiumAccess(channel.creatorAddress);
      default:
        return false;
    }
  };

  const checkSubscriptionStatus = async (_creatorAddress: string): Promise<boolean> => {
    // Mock implementation - would check actual subscription
    return true;
  };

  const checkNftOwnership = async (_creatorAddress: string, _tierRequired?: number): Promise<boolean> => {
    // Mock implementation - would check NFT ownership
    return true;
  };

  const checkPremiumAccess = async (_creatorAddress: string): Promise<boolean> => {
    // Mock implementation - would check premium status
    return true;
  };

  const fetchCommunityChannelsFromChain = async (): Promise<CommunityChannel[]> => {
    // Mock implementation
    return [
      {
        id: '1',
        platform: 'discord',
        name: 'Creator Community',
        description: 'Official Discord server for subscribers',
        memberCount: 1250,
        isConnected: true,
        inviteLink: 'https://discord.gg/example',
        creatorAddress,
        accessLevel: 'subscribers',
        createdAt: Date.now() / 1000 - 86400
      },
      {
        id: '2',
        platform: 'telegram',
        name: 'VIP Holders',
        description: 'Exclusive Telegram group for NFT holders',
        memberCount: 89,
        isConnected: true,
        inviteLink: 'https://t.me/example',
        creatorAddress,
        accessLevel: 'nft_holders',
        requiredNftTier: 1,
        createdAt: Date.now() / 1000 - 172800
      }
    ];
  };

  const resetNewChannel = () => {
    setNewChannel({
      name: '',
      description: '',
      accessLevel: 'subscribers',
      requiredNftTier: 1,
      inviteLink: '',
      webhookUrl: '',
      botToken: ''
    });
  };

  const getPlatformIcon = (platform: 'discord' | 'telegram') => {
    return platform === 'discord' ? '🎮' : '✈️';
  };

  const getAccessLevelColor = (level: CommunityChannel['accessLevel']) => {
    switch (level) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'subscribers': return 'bg-blue-100 text-blue-800';
      case 'nft_holders': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const CommunityChannelCard: React.FC<{ channel: CommunityChannel }> = ({ channel }) => (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getPlatformIcon(channel.platform)}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{channel.name}</h3>
            <p className="text-sm text-gray-600 capitalize">{channel.platform}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccessLevelColor(channel.accessLevel)}`}>
          {channel.accessLevel.replace('_', ' ')}
        </span>
      </div>

      <p className="text-gray-700 mb-4">{channel.description}</p>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4" />
          <span>{channel.memberCount} members</span>
        </div>
        <div className={`flex items-center space-x-1 ${channel.isConnected ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${channel.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{channel.isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {channel.accessLevel === 'nft_holders' && channel.requiredNftTier && (
        <div className="text-sm text-purple-600 mb-4">
          Requires NFT Tier {channel.requiredNftTier}
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={() => joinCommunity(channel.id)}
          className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Join Community</span>
        </button>
        {isCreator && (
          <button className="flex items-center space-x-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold">Community Integration</h2>
        </div>
        {isCreator && isConnected && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Add Community</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading communities...</p>
        </div>
      ) : channels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {channels.map(channel => (
            <CommunityChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No community channels yet.</p>
          {isCreator && <p className="text-sm">Create your first community to connect with fans!</p>}
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Create Community Channel</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform
                </label>
                <div className="flex space-x-4">
                  {(['discord', 'telegram'] as const).map(platform => (
                    <button
                      key={platform}
                      onClick={() => setSelectedPlatform(platform)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                        selectedPlatform === platform
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{getPlatformIcon(platform)}</span>
                      <span className="capitalize">{platform}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Community Name
                </label>
                <input
                  type="text"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="My Creator Community"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newChannel.description}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  rows={3}
                  placeholder="Describe your community..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Level
                </label>
                <select
                  value={newChannel.accessLevel}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, accessLevel: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="public">Public</option>
                  <option value="subscribers">Subscribers Only</option>
                  <option value="nft_holders">NFT Holders Only</option>
                  <option value="premium">Premium Members</option>
                </select>
              </div>

              {newChannel.accessLevel === 'nft_holders' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required NFT Tier
                  </label>
                  <input
                    type="number"
                    value={newChannel.requiredNftTier}
                    onChange={(e) => setNewChannel(prev => ({ ...prev, requiredNftTier: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    min="1"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invite Link
                </label>
                <input
                  type="url"
                  value={newChannel.inviteLink}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, inviteLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder={selectedPlatform === 'discord' ? 'https://discord.gg/...' : 'https://t.me/...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL (Optional)
                </label>
                <input
                  type="url"
                  value={newChannel.webhookUrl}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="For automated notifications"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createCommunityChannel}
                disabled={!newChannel.name || !newChannel.description || !newChannel.inviteLink}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Community
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};