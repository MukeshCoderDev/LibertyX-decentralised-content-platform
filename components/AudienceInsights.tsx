import React, { useState, useEffect } from 'react';
import { 
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { useWallet } from '../lib/WalletProvider';
import { useAnalyticsEngine } from '../hooks/useAnalyticsEngine';

import Button from './ui/Button';

interface SubscriberGrowthData {
  date: string;
  subscribers: number;
  newSubscribers: number;
  churnRate: number;
}

interface RetentionAnalysis {
  period: string;
  retentionRate: number;
  cohortSize: number;
}

interface EngagementSegments {
  segment: string;
  count: number;
  percentage: number;
  avgWatchTime: number;
  conversionRate: number;
}

const AudienceInsights: React.FC = () => {
  const { account } = useWallet();
  const { getAudienceInsights, getViewerDemographics } = useAnalyticsEngine();
  // const { getSubscriberStats } = useSubscriptionManager();
  
  const [subscriberGrowth, setSubscriberGrowth] = useState<SubscriberGrowthData[]>([]);
  const [retentionData, setRetentionData] = useState<RetentionAnalysis[]>([]);
  const [engagementSegments, setEngagementSegments] = useState<EngagementSegments[]>([]);
  const [audienceInsights, setAudienceInsights] = useState<any>(null);
  const [demographics, setDemographics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30d' | '90d' | '1y'>('90d');

  useEffect(() => {
    if (account) {
      loadAudienceData();
    }
  }, [account, selectedTimeframe]);

  const loadAudienceData = async () => {
    if (!account) return;

    try {
      setLoading(true);
      
      const [insights, demographicsData] = await Promise.all([
        getAudienceInsights(account),
        getViewerDemographics(account, selectedTimeframe)
      ]);

      setAudienceInsights(insights);
      setDemographics(demographicsData);
      
      // Generate subscriber growth data
      const growthData = generateSubscriberGrowthData();
      setSubscriberGrowth(growthData);
      
      // Generate retention analysis
      const retention = generateRetentionData();
      setRetentionData(retention);
      
      // Generate engagement segments
      const segments = generateEngagementSegments();
      setEngagementSegments(segments);
      
    } catch (error) {
      console.error('Error loading audience data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSubscriberGrowthData = (): SubscriberGrowthData[] => {
    const data: SubscriberGrowthData[] = [];
    const baseSubscribers = 1000;
    let currentSubscribers = baseSubscribers;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const growth = Math.floor(Math.random() * 50) + 10;
      const churn = Math.floor(Math.random() * 20) + 5;
      const newSubscribers = growth - churn;
      
      currentSubscribers += newSubscribers;
      
      data.push({
        date: date.toISOString().split('T')[0],
        subscribers: currentSubscribers,
        newSubscribers: Math.max(0, newSubscribers),
        churnRate: (churn / currentSubscribers) * 100
      });
    }
    
    return data;
  };

  const generateRetentionData = (): RetentionAnalysis[] => {
    return [
      { period: 'Week 1', retentionRate: 85, cohortSize: 1000 },
      { period: 'Week 2', retentionRate: 72, cohortSize: 850 },
      { period: 'Month 1', retentionRate: 65, cohortSize: 720 },
      { period: 'Month 2', retentionRate: 58, cohortSize: 650 },
      { period: 'Month 3', retentionRate: 52, cohortSize: 580 },
      { period: 'Month 6', retentionRate: 45, cohortSize: 520 }
    ];
  };

  const generateEngagementSegments = (): EngagementSegments[] => {
    return [
      {
        segment: 'Super Fans',
        count: 150,
        percentage: 12,
        avgWatchTime: 720,
        conversionRate: 85
      },
      {
        segment: 'Regular Viewers',
        count: 400,
        percentage: 32,
        avgWatchTime: 420,
        conversionRate: 45
      },
      {
        segment: 'Casual Browsers',
        count: 500,
        percentage: 40,
        avgWatchTime: 180,
        conversionRate: 15
      },
      {
        segment: 'One-time Visitors',
        count: 200,
        percentage: 16,
        avgWatchTime: 60,
        conversionRate: 3
      }
    ];
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-satoshi font-bold">Audience Insights</h2>
        <div className="flex gap-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]"
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button
            variant="secondary"
            onClick={loadAudienceData}
            className="text-sm min-h-[44px]"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Total Subscribers</h3>
          <p className="text-2xl font-bold text-primary">
            {subscriberGrowth[subscriberGrowth.length - 1]?.subscribers.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-green-400 mt-1">
            +{audienceInsights?.subscriberGrowth ? formatPercentage(audienceInsights.subscriberGrowth) : '0%'} this month
          </p>
        </div>
        
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Retention Rate</h3>
          <p className="text-2xl font-bold text-primary">
            {audienceInsights ? formatPercentage(audienceInsights.retentionRate) : '0%'}
          </p>
          <p className="text-xs text-green-400 mt-1">Above industry average</p>
        </div>
        
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Avg. Watch Time</h3>
          <p className="text-2xl font-bold text-primary">
            {audienceInsights ? formatDuration(audienceInsights.behaviorPatterns.preferredContentLength) : '0m'}
          </p>
          <p className="text-xs text-yellow-400 mt-1">Optimal length detected</p>
        </div>
        
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Engagement Score</h3>
          <p className="text-2xl font-bold text-primary">8.7/10</p>
          <p className="text-xs text-green-400 mt-1">Excellent engagement</p>
        </div>
      </div>

      {/* Subscriber Growth Chart */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-lg font-satoshi font-bold mb-4">Subscriber Growth Trend</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={subscriberGrowth}>
              <defs>
                <linearGradient id="colorSubscribers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF0050" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#7928CA" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#37373b" />
              <XAxis dataKey="date" stroke="#A0A0A0" />
              <YAxis stroke="#A0A0A0" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1A1A1D', 
                  border: 'none', 
                  borderRadius: '10px' 
                }}
                formatter={(value: number, name: string) => [
                  name === 'subscribers' ? value.toLocaleString() : value,
                  name === 'subscribers' ? 'Total Subscribers' : 'New Subscribers'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="subscribers" 
                stroke="#FF0050" 
                fillOpacity={1} 
                fill="url(#colorSubscribers)" 
              />
              <Line 
                type="monotone" 
                dataKey="newSubscribers" 
                stroke="#00D4FF" 
                strokeWidth={2}
                dot={{ fill: '#00D4FF', strokeWidth: 2, r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement Segments and Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Segments */}
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-lg font-satoshi font-bold mb-4">Audience Segments</h3>
          <div className="space-y-4">
            {engagementSegments.map((segment) => (
              <div key={segment.segment} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{segment.segment}</span>
                  <span className="text-sm text-text-secondary">
                    {segment.count} users ({segment.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div 
                    className="h-2 bg-primary rounded-full"
                    style={{ width: `${segment.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>Avg. Watch: {formatDuration(segment.avgWatchTime)}</span>
                  <span>Conversion: {segment.conversionRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retention Analysis */}
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-lg font-satoshi font-bold mb-4">Retention Analysis</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#37373b" />
                <XAxis dataKey="period" stroke="#A0A0A0" />
                <YAxis stroke="#A0A0A0" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A1A1D', 
                    border: 'none', 
                    borderRadius: '10px' 
                  }}
                  formatter={(value: number) => [`${value}%`, 'Retention Rate']}
                />
                <Bar dataKey="retentionRate" fill="#FF0050" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Demographics Overview */}
      {demographics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Age Distribution */}
          <div className="bg-card p-6 rounded-2xl">
            <h3 className="text-lg font-satoshi font-bold mb-4">Age Distribution</h3>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={demographics.ageGroups}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="count"
                    label={({ age, percentage }) => `${age}: ${percentage.toFixed(1)}%`}
                  >
                    {demographics.ageGroups.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#FF0050', '#7928CA', '#00D4FF', '#50E3C2', '#FFD700'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Interests */}
          <div className="bg-card p-6 rounded-2xl">
            <h3 className="text-lg font-satoshi font-bold mb-4">Top Interests</h3>
            <div className="space-y-3">
              {audienceInsights?.topInterests.map((interest: string, index: number) => (
                <div key={interest} className="flex items-center justify-between">
                  <span className="text-sm">{interest}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-border rounded-full h-2">
                      <div 
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${100 - index * 15}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-text-secondary w-12 text-right">
                      {100 - index * 15}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Behavioral Insights */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-lg font-satoshi font-bold mb-4">Behavioral Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium mb-3">Peak Viewing Hours</h4>
            <div className="space-y-2">
              {audienceInsights?.behaviorPatterns.peakViewingHours.map((hour: number) => {
                const period = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                return (
                  <div key={hour} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm">{displayHour}:00 {period}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Device Preferences</h4>
            <div className="space-y-2">
              {demographics?.devices.map((device: any) => (
                <div key={device.device} className="flex items-center justify-between">
                  <span className="text-sm">{device.device}</span>
                  <span className="text-sm text-text-secondary">{device.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Content Preferences</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Preferred Length</span>
                <span className="text-sm text-text-secondary">
                  {audienceInsights ? formatDuration(audienceInsights.behaviorPatterns.preferredContentLength) : '0m'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completion Rate</span>
                <span className="text-sm text-text-secondary">68%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Replay Rate</span>
                <span className="text-sm text-text-secondary">15%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudienceInsights;