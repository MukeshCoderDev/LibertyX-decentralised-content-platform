import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { useWallet } from '../lib/WalletProvider';
import { useContentStatistics } from '../hooks/useContentStatistics';
import { useAnalyticsEngine } from '../hooks/useAnalyticsEngine';
import Button from './ui/Button';
import ContentPerformanceComparison from './ContentPerformanceComparison';

interface ViewerDemographics {
  ageGroups: { age: string; count: number; percentage: number }[];
  locations: { country: string; count: number; percentage: number }[];
  devices: { device: string; count: number; percentage: number }[];
  walletTypes: { wallet: string; count: number; percentage: number }[];
}

interface EngagementMetrics {
  averageWatchTime: number;
  completionRate: number;
  replayRate: number;
  interactionRate: number;
  shareRate: number;
  subscriptionConversionRate: number;
}

interface ContentPerformance {
  contentId: number;
  title: string;
  views: number;
  earnings: number;
  engagement: number;
  trendScore: number;
  optimalPostTime: string;
}

interface RevenueForecasting {
  nextMonth: number;
  nextQuarter: number;
  yearEnd: number;
  growthRate: number;
  confidence: number;
}

const AdvancedAnalytics: React.FC = () => {
  const { account } = useWallet();
  const { creatorStats, refreshCreatorStats } = useContentStatistics();
  const { 
    getViewerDemographics, 
    getEngagementMetrics, 
    getContentPerformance,
    getRevenueForecasting,
    getAudienceInsights,
    getTrendingAnalysis
  } = useAnalyticsEngine();

  const [demographics, setDemographics] = useState<ViewerDemographics | null>(null);
  const [engagement, setEngagement] = useState<EngagementMetrics | null>(null);
  const [performance, setPerformance] = useState<ContentPerformance[]>([]);
  const [forecasting, setForecasting] = useState<RevenueForecasting | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'audience' | 'content' | 'comparison' | 'forecasting'>('overview');

  useEffect(() => {
    if (account) {
      loadAnalyticsData();
    }
  }, [account, selectedTimeframe]);

  const loadAnalyticsData = async () => {
    if (!account) return;

    try {
      setLoading(true);
      
      const [
        demographicsData,
        engagementData,
        performanceData,
        forecastingData
      ] = await Promise.all([
        getViewerDemographics(account, selectedTimeframe),
        getEngagementMetrics(account, selectedTimeframe),
        getContentPerformance(account, selectedTimeframe),
        getRevenueForecasting(account)
      ]);

      setDemographics(demographicsData);
      setEngagement(engagementData);
      setPerformance(performanceData);
      setForecasting(forecastingData);
      
      // Refresh creator stats
      await refreshCreatorStats(account);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (amount: number): string => {
    return `${amount.toFixed(4)} LIB`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-border rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-border rounded-2xl"></div>
            ))}
          </div>
          <div className="h-96 bg-border rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-satoshi font-bold">Advanced Analytics</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button
            variant="secondary"
            onClick={loadAnalyticsData}
            className="text-sm min-h-[44px]"
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-card rounded-lg p-1">
        {[
          { key: 'overview', label: 'Overview', icon: '📊' },
          { key: 'audience', label: 'Audience', icon: '👥' },
          { key: 'content', label: 'Content', icon: '🎬' },
          { key: 'comparison', label: 'A/B Testing', icon: '⚖️' },
          { key: 'forecasting', label: 'Forecasting', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <span className="sm:hidden">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card p-6 rounded-2xl">
              <h3 className="text-sm font-medium text-text-secondary mb-2">Total Views</h3>
              <p className="text-2xl font-bold text-primary">
                {creatorStats?.totalViews.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-green-400 mt-1">+12.5% vs last period</p>
            </div>
            
            <div className="bg-card p-6 rounded-2xl">
              <h3 className="text-sm font-medium text-text-secondary mb-2">Avg. Watch Time</h3>
              <p className="text-2xl font-bold text-primary">
                {engagement ? formatDuration(engagement.averageWatchTime) : '0:00'}
              </p>
              <p className="text-xs text-green-400 mt-1">+8.3% vs last period</p>
            </div>
            
            <div className="bg-card p-6 rounded-2xl">
              <h3 className="text-sm font-medium text-text-secondary mb-2">Engagement Rate</h3>
              <p className="text-2xl font-bold text-primary">
                {engagement ? formatPercentage(engagement.interactionRate) : '0%'}
              </p>
              <p className="text-xs text-red-400 mt-1">-2.1% vs last period</p>
            </div>
            
            <div className="bg-card p-6 rounded-2xl">
              <h3 className="text-sm font-medium text-text-secondary mb-2">Revenue Growth</h3>
              <p className="text-2xl font-bold text-primary">
                {forecasting ? formatPercentage(forecasting.growthRate / 100) : '0%'}
              </p>
              <p className="text-xs text-green-400 mt-1">Monthly growth rate</p>
            </div>
          </div>

          {/* Engagement Overview Chart */}
          <div className="bg-card p-6 rounded-2xl">
            <h3 className="text-lg font-satoshi font-bold mb-4">Engagement Metrics Overview</h3>
            {engagement && (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <RadarChart data={[
                    { metric: 'Watch Time', value: engagement.averageWatchTime / 600 * 100 },
                    { metric: 'Completion', value: engagement.completionRate * 100 },
                    { metric: 'Replay Rate', value: engagement.replayRate * 100 },
                    { metric: 'Interaction', value: engagement.interactionRate * 100 },
                    { metric: 'Share Rate', value: engagement.shareRate * 100 },
                    { metric: 'Conversion', value: engagement.subscriptionConversionRate * 100 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Engagement"
                      dataKey="value"
                      stroke="#FF0050"
                      fill="#FF0050"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'audience' && demographics && (
        <div className="space-y-6">
          {/* Demographics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Groups */}
            <div className="bg-card p-6 rounded-2xl">
              <h3 className="text-lg font-satoshi font-bold mb-4">Audience by Age</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={demographics.ageGroups}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#37373b" />
                    <XAxis dataKey="age" stroke="#A0A0A0" />
                    <YAxis stroke="#A0A0A0" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1A1A1D', 
                        border: 'none', 
                        borderRadius: '10px' 
                      }}
                    />
                    <Bar dataKey="count" fill="#FF0050" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-card p-6 rounded-2xl">
              <h3 className="text-lg font-satoshi font-bold mb-4">Geographic Distribution</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={demographics.locations}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="count"
                      label={({ country, percentage }) => `${country} ${percentage.toFixed(1)}%`}
                    >
                      {demographics.locations.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#FF0050', '#7928CA', '#00D4FF', '#50E3C2', '#FFD700'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Device and Wallet Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-2xl">
              <h3 className="text-lg font-satoshi font-bold mb-4">Device Usage</h3>
              <div className="space-y-3">
                {demographics.devices.map((device, index) => (
                  <div key={device.device} className="flex items-center justify-between">
                    <span className="text-sm">{device.device}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-border rounded-full h-2">
                        <div 
                          className="h-2 bg-primary rounded-full"
                          style={{ width: `${device.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-text-secondary w-12 text-right">
                        {device.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card p-6 rounded-2xl">
              <h3 className="text-lg font-satoshi font-bold mb-4">Wallet Distribution</h3>
              <div className="space-y-3">
                {demographics.walletTypes.map((wallet, index) => (
                  <div key={wallet.wallet} className="flex items-center justify-between">
                    <span className="text-sm">{wallet.wallet}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-border rounded-full h-2">
                        <div 
                          className="h-2 bg-primary rounded-full"
                          style={{ width: `${wallet.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-text-secondary w-12 text-right">
                        {wallet.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Content Performance Table */}
          <div className="bg-card p-6 rounded-2xl">
            <h3 className="text-lg font-satoshi font-bold mb-4">Content Performance Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2">Content</th>
                    <th className="text-right py-3 px-2">Views</th>
                    <th className="text-right py-3 px-2">Earnings</th>
                    <th className="text-right py-3 px-2">Engagement</th>
                    <th className="text-right py-3 px-2">Trend Score</th>
                    <th className="text-right py-3 px-2">Optimal Time</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((content) => (
                    <tr key={content.contentId} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <div className="truncate max-w-[200px]">{content.title}</div>
                      </td>
                      <td className="text-right py-3 px-2">{content.views.toLocaleString()}</td>
                      <td className="text-right py-3 px-2 text-green-400">
                        {formatCurrency(content.earnings)}
                      </td>
                      <td className="text-right py-3 px-2">
                        {formatPercentage(content.engagement / 100)}
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          content.trendScore > 80 ? 'bg-green-500/20 text-green-400' :
                          content.trendScore > 60 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {content.trendScore}
                        </span>
                      </td>
                      <td className="text-right py-3 px-2 text-text-secondary">
                        {content.optimalPostTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Trends */}
          <div className="bg-card p-6 rounded-2xl">
            <h3 className="text-lg font-satoshi font-bold mb-4">Performance Trends</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={performance.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#37373b" />
                  <XAxis dataKey="title" stroke="#A0A0A0" />
                  <YAxis stroke="#A0A0A0" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1A1A1D', 
                      border: 'none', 
                      borderRadius: '10px' 
                    }}
                  />
                  <Line type="monotone" dataKey="views" stroke="#FF0050" strokeWidth={2} />
                  <Line type="monotone" dataKey="engagement" stroke="#7928CA" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        <ContentPerformanceComparison />
      )}

      {activeTab === 'forecasting' && forecasting && (
        <div className="space-y-6">
          {/* Revenue Forecasting Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card p-6 rounded-2xl">
              <h3 className="text-sm font-medium text-text-secondary mb-2">Next Month Forecast</h3>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(forecasting.nextMonth)}
              </p>
              <p className="text-xs text-green-400 mt-1">
                {formatPercentage(forecasting.confidence / 100)} confidence
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-2xl">
              <h3 className="text-sm font-medium text-text-secondary mb-2">Quarterly Projection</h3>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(forecasting.nextQuarter)}
              </p>
              <p className="text-xs text-green-400 mt-1">
                Based on current trends
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-2xl">
              <h3 className="text-sm font-medium text-text-secondary mb-2">Year-End Estimate</h3>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(forecasting.yearEnd)}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Conservative estimate
              </p>
            </div>
          </div>

          {/* Growth Analysis */}
          <div className="bg-card p-6 rounded-2xl">
            <h3 className="text-lg font-satoshi font-bold mb-4">Growth Analysis & Recommendations</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Key Growth Drivers</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm">Consistent upload schedule (+15% engagement)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm">NFT tier adoption (+23% revenue)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm">Cross-platform promotion (moderate impact)</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Optimization Opportunities</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-sm">Improve thumbnail design (-12% CTR)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-sm">Optimize posting times (+8% potential views)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm">Expand to trending categories</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;