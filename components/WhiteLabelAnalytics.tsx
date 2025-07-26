import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';

interface AnalyticsData {
  totalViews: number;
  totalEarnings: string;
  subscriberCount: number;
  engagementRate: number;
  topContent: ContentPerformance[];
  revenueChart: ChartDataPoint[];
  audienceData: AudienceSegment[];
  conversionMetrics: ConversionData;
}

interface ContentPerformance {
  id: string;
  title: string;
  views: number;
  earnings: string;
  engagementRate: number;
  publishDate: string;
}

interface ChartDataPoint {
  date: string;
  earnings: number;
  views: number;
}

interface AudienceSegment {
  segment: string;
  percentage: number;
  growth: number;
}

interface ConversionData {
  subscriptionRate: number;
  nftMintRate: number;
  averageSpend: string;
  retentionRate: number;
}

interface WhiteLabelAnalyticsProps {
  creatorAddress?: string;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logoUrl?: string;
  companyName?: string;
}

export const WhiteLabelAnalytics: React.FC<WhiteLabelAnalyticsProps> = ({
  creatorAddress,
  brandColors = {
    primary: '#3B82F6',
    secondary: '#1F2937',
    accent: '#10B981'
  },
  logoUrl,
  companyName = 'LibertyX Analytics'
}) => {
  const { account, isConnected } = useWallet();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');

  useEffect(() => {
    if (isConnected) {
      loadAnalyticsData();
    }
  }, [isConnected, creatorAddress, timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, this would fetch from analytics service
      const mockData: AnalyticsData = {
        totalViews: 125430,
        totalEarnings: '2,847.5',
        subscriberCount: 3420,
        engagementRate: 8.7,
        topContent: [
          {
            id: '1',
            title: 'DeFi Explained: Complete Guide',
            views: 15420,
            earnings: '342.8',
            engagementRate: 12.3,
            publishDate: '2025-01-20'
          },
          {
            id: '2',
            title: 'NFT Market Analysis 2025',
            views: 12850,
            earnings: '298.4',
            engagementRate: 10.8,
            publishDate: '2025-01-18'
          }
        ],
        revenueChart: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          earnings: Math.random() * 100 + 50,
          views: Math.random() * 1000 + 500
        })),
        audienceData: [
          { segment: 'Crypto Enthusiasts', percentage: 45, growth: 12.5 },
          { segment: 'DeFi Users', percentage: 30, growth: 8.2 },
          { segment: 'NFT Collectors', percentage: 15, growth: 15.7 },
          { segment: 'General Tech', percentage: 10, growth: 5.1 }
        ],
        conversionMetrics: {
          subscriptionRate: 4.2,
          nftMintRate: 2.8,
          averageSpend: '12.4',
          retentionRate: 78.5
        }
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      // Implementation would generate and download the report
      console.log(`Exporting report as ${exportFormat}`);
      // Mock download
      const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${timeRange}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to access analytics</p>
        </div>
      </div>
    );
  }

  if (loading || !analyticsData) {
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Custom Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {logoUrl && (
              <img src={logoUrl} alt={companyName} className="h-10 w-auto" />
            )}
            <div>
              <h1 className="text-2xl font-bold" style={{ color: brandColors.primary }}>
                {companyName}
              </h1>
              <p className="text-gray-400">Professional Analytics Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="pdf">Export as PDF</option>
              <option value="csv">Export as CSV</option>
              <option value="json">Export as JSON</option>
            </select>
            <button
              onClick={exportReport}
              className="px-4 py-2 rounded-lg transition-colors text-white"
              style={{ backgroundColor: brandColors.primary }}
            >
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border-l-4" style={{ borderColor: brandColors.primary }}>
            <h3 className="text-lg font-semibold mb-2">Total Views</h3>
            <p className="text-3xl font-bold" style={{ color: brandColors.primary }}>
              {analyticsData.totalViews.toLocaleString()}
            </p>
            <p className="text-sm text-green-400 mt-1">↗ +12.5% from last period</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border-l-4" style={{ borderColor: brandColors.accent }}>
            <h3 className="text-lg font-semibold mb-2">Total Earnings</h3>
            <p className="text-3xl font-bold" style={{ color: brandColors.accent }}>
              {analyticsData.totalEarnings} LIB
            </p>
            <p className="text-sm text-green-400 mt-1">↗ +8.3% from last period</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold mb-2">Subscribers</h3>
            <p className="text-3xl font-bold text-purple-400">
              {analyticsData.subscriberCount.toLocaleString()}
            </p>
            <p className="text-sm text-green-400 mt-1">↗ +15.2% from last period</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold mb-2">Engagement Rate</h3>
            <p className="text-3xl font-bold text-yellow-400">
              {analyticsData.engagementRate}%
            </p>
            <p className="text-sm text-green-400 mt-1">↗ +2.1% from last period</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Revenue Trend</h3>
          <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Chart visualization would be implemented here</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Content */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Top Performing Content</h3>
            <div className="space-y-4">
              {analyticsData.topContent.map((content, index) => (
                <div key={content.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                         style={{ backgroundColor: brandColors.primary }}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">{content.title}</h4>
                      <p className="text-sm text-gray-400">
                        {content.views.toLocaleString()} views • {content.engagementRate}% engagement
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold" style={{ color: brandColors.accent }}>
                      {content.earnings} LIB
                    </p>
                    <p className="text-sm text-gray-400">{content.publishDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audience Segments */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Audience Segments</h3>
            <div className="space-y-4">
              {analyticsData.audienceData.map((segment) => (
                <div key={segment.segment} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{segment.segment}</span>
                    <div className="flex items-center space-x-2">
                      <span>{segment.percentage}%</span>
                      <span className={`text-sm ${segment.growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {segment.growth > 0 ? '↗' : '↘'} {Math.abs(segment.growth)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${segment.percentage}%`,
                        backgroundColor: brandColors.primary 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Metrics */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Conversion Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: brandColors.primary }}>
                {analyticsData.conversionMetrics.subscriptionRate}%
              </p>
              <p className="text-gray-400">Subscription Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: brandColors.accent }}>
                {analyticsData.conversionMetrics.nftMintRate}%
              </p>
              <p className="text-gray-400">NFT Mint Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {analyticsData.conversionMetrics.averageSpend} LIB
              </p>
              <p className="text-gray-400">Average Spend</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {analyticsData.conversionMetrics.retentionRate}%
              </p>
              <p className="text-gray-400">Retention Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteLabelAnalytics;