import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { monitoring } from '../lib/monitoring';
import { errorTracking } from '../lib/errorTracking.tsx';

interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCreators: number;
  activeCreators: number;
  totalContent: number;
  totalRevenue: string;
  totalTransactions: number;
  averageSessionTime: number;
}

interface ChainMetrics {
  chainId: number;
  name: string;
  transactionCount: number;
  totalVolume: string;
  averageGasPrice: string;
  successRate: number;
}

interface ContentMetrics {
  totalViews: number;
  totalUploads: number;
  averageViewDuration: number;
  topCategories: { name: string; count: number }[];
  uploadTrends: { date: string; count: number }[];
}

interface UserEngagement {
  dailyActiveUsers: { date: string; count: number }[];
  sessionDuration: { date: string; duration: number }[];
  retentionRate: number;
  bounceRate: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const { isConnected } = useWallet();
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics | null>(null);
  const [chainMetrics, setChainMetrics] = useState<ChainMetrics[]>([]);
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics | null>(null);
  const [userEngagement, setUserEngagement] = useState<UserEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'chains' | 'content' | 'users'>('overview');

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      // Mock data - in real implementation, this would fetch from analytics service
      const mockPlatformMetrics: PlatformMetrics = {
        totalUsers: 25420,
        activeUsers: 3250,
        totalCreators: 1850,
        activeCreators: 420,
        totalContent: 12680,
        totalRevenue: '1,250,000',
        totalTransactions: 89450,
        averageSessionTime: 1245, // seconds
      };

      const mockChainMetrics: ChainMetrics[] = [
        {
          chainId: 1,
          name: 'Ethereum',
          transactionCount: 45230,
          totalVolume: '850,000',
          averageGasPrice: '25.5',
          successRate: 98.2,
        },
        {
          chainId: 137,
          name: 'Polygon',
          transactionCount: 32150,
          totalVolume: '320,000',
          averageGasPrice: '30.2',
          successRate: 99.1,
        },
        {
          chainId: 42161,
          name: 'Arbitrum',
          transactionCount: 12070,
          totalVolume: '180,000',
          averageGasPrice: '0.1',
          successRate: 99.5,
        },
      ];

      const mockContentMetrics: ContentMetrics = {
        totalViews: 2450000,
        totalUploads: 12680,
        averageViewDuration: 285, // seconds
        topCategories: [
          { name: 'Gaming', count: 3250 },
          { name: 'Education', count: 2890 },
          { name: 'Entertainment', count: 2650 },
          { name: 'Technology', count: 2100 },
          { name: 'Art', count: 1790 },
        ],
        uploadTrends: generateTrendData(30),
      };

      const mockUserEngagement: UserEngagement = {
        dailyActiveUsers: generateTrendData(30),
        sessionDuration: generateDurationData(30),
        retentionRate: 68.5,
        bounceRate: 24.3,
      };

      setPlatformMetrics(mockPlatformMetrics);
      setChainMetrics(mockChainMetrics);
      setContentMetrics(mockContentMetrics);
      setUserEngagement(mockUserEngagement);

      monitoring.trackEvent({
        type: 'info',
        category: 'analytics',
        message: 'Analytics data loaded',
        data: { timeRange },
      });
    } catch (error) {
      errorTracking.trackError(error as Error, {
        component: 'AnalyticsDashboard',
        action: 'loadAnalytics',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = (days: number) => {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      count: Math.floor(Math.random() * 1000) + 500,
    }));
  };

  const generateDurationData = (days: number) => {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: Math.floor(Math.random() * 600) + 300, // 5-15 minutes
    }));
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to access analytics dashboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Platform Analytics</h1>
            <p className="text-gray-400 mt-2">Comprehensive platform performance and usage metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={loadAnalytics}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'chains', label: 'Blockchain', icon: '⛓️' },
            { id: 'content', label: 'Content', icon: '🎥' },
            { id: 'users', label: 'Users', icon: '👥' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                selectedTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && platformMetrics && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                <p className="text-3xl font-bold text-blue-400">{formatNumber(platformMetrics.totalUsers)}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {formatNumber(platformMetrics.activeUsers)} active
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-green-500">
                <h3 className="text-lg font-semibold mb-2">Total Creators</h3>
                <p className="text-3xl font-bold text-green-400">{formatNumber(platformMetrics.totalCreators)}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {formatNumber(platformMetrics.activeCreators)} active
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
                <p className="text-3xl font-bold text-purple-400">${platformMetrics.totalRevenue}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {formatNumber(platformMetrics.totalTransactions)} transactions
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-yellow-500">
                <h3 className="text-lg font-semibold mb-2">Avg Session</h3>
                <p className="text-3xl font-bold text-yellow-400">
                  {formatDuration(platformMetrics.averageSessionTime)}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {formatNumber(platformMetrics.totalContent)} content items
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Blockchain Tab */}
        {selectedTab === 'chains' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {chainMetrics.map((chain) => (
                <div key={chain.chainId} className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{chain.name}</h3>
                    <span className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-sm">
                      {chain.successRate}% success
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transactions:</span>
                      <span className="text-white font-semibold">
                        {formatNumber(chain.transactionCount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Volume:</span>
                      <span className="text-white font-semibold">${chain.totalVolume}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Gas:</span>
                      <span className="text-white font-semibold">{chain.averageGasPrice} gwei</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Tab */}
        {selectedTab === 'content' && contentMetrics && (
          <div className="space-y-8">
            {/* Content Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Total Views</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {formatNumber(contentMetrics.totalViews)}
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Total Uploads</h3>
                <p className="text-3xl font-bold text-green-400">
                  {formatNumber(contentMetrics.totalUploads)}
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Avg View Duration</h3>
                <p className="text-3xl font-bold text-purple-400">
                  {formatDuration(contentMetrics.averageViewDuration)}
                </p>
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Top Content Categories</h3>
              <div className="space-y-3">
                {contentMetrics.topCategories.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">#{index + 1}</span>
                      <span className="font-semibold">{category.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-400">{formatNumber(category.count)} items</span>
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(category.count / contentMetrics.topCategories[0].count) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && userEngagement && (
          <div className="space-y-8">
            {/* User Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Retention Rate</h3>
                <p className="text-3xl font-bold text-green-400">{userEngagement.retentionRate}%</p>
                <p className="text-sm text-gray-400 mt-1">7-day retention</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Bounce Rate</h3>
                <p className="text-3xl font-bold text-red-400">{userEngagement.bounceRate}%</p>
                <p className="text-sm text-gray-400 mt-1">Single session visits</p>
              </div>
            </div>

            {/* Daily Active Users Chart */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Daily Active Users</h3>
              <div className="h-64 flex items-end space-x-1">
                {userEngagement.dailyActiveUsers.slice(-14).map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div
                      className="bg-blue-500 w-full rounded-t"
                      style={{
                        height: `${(day.count / Math.max(...userEngagement.dailyActiveUsers.map(d => d.count))) * 200}px`,
                      }}
                    ></div>
                    <span className="text-xs text-gray-400 mt-2 transform rotate-45">
                      {day.date.split('-').slice(1).join('/')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};