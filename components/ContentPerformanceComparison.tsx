import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter
} from 'recharts';
import { useAnalyticsEngine } from '../hooks/useAnalyticsEngine';
import { useWallet } from '../lib/WalletProvider';
import Button from './ui/Button';

interface ContentComparison {
  contentId: number;
  title: string;
  views: number;
  earnings: number;
  engagement: number;
  thumbnailCTR: number;
  avgWatchTime: number;
  completionRate: number;
  shareRate: number;
}

interface ABTestResult {
  testType: 'thumbnail' | 'title' | 'description' | 'posting_time';
  variantA: {
    name: string;
    performance: number;
    sampleSize: number;
  };
  variantB: {
    name: string;
    performance: number;
    sampleSize: number;
  };
  winner: 'A' | 'B' | 'inconclusive';
  improvement: number;
  confidence: number;
}

const ContentPerformanceComparison: React.FC = () => {
  const { account } = useWallet();
  const { getContentPerformance, getABTestingInsights } = useAnalyticsEngine();
  
  const [contentData, setContentData] = useState<ContentComparison[]>([]);
  const [abTestResults, setAbTestResults] = useState<ABTestResult[]>([]);
  const [selectedContent, setSelectedContent] = useState<number[]>([]);
  const [comparisonMetric, setComparisonMetric] = useState<'views' | 'earnings' | 'engagement'>('views');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account) {
      loadComparisonData();
    }
  }, [account]);

  const loadComparisonData = async () => {
    if (!account) return;

    try {
      setLoading(true);
      
      const performance = await getContentPerformance(account, '30d');
      
      // Transform performance data for comparison
      const comparisonData: ContentComparison[] = performance.map(content => ({
        contentId: content.contentId,
        title: content.title,
        views: content.views,
        earnings: content.earnings,
        engagement: content.engagement,
        thumbnailCTR: Math.random() * 0.15 + 0.05, // Mock CTR data
        avgWatchTime: Math.random() * 600 + 120, // Mock watch time
        completionRate: Math.random() * 0.4 + 0.4, // Mock completion rate
        shareRate: Math.random() * 0.1 + 0.02 // Mock share rate
      }));

      setContentData(comparisonData);

      // Generate A/B test results
      const abTests: ABTestResult[] = [
        {
          testType: 'thumbnail',
          variantA: { name: 'Original Thumbnail', performance: 0.12, sampleSize: 1000 },
          variantB: { name: 'Bright Colors', performance: 0.15, sampleSize: 1000 },
          winner: 'B',
          improvement: 25,
          confidence: 95
        },
        {
          testType: 'title',
          variantA: { name: 'Generic Title', performance: 850, sampleSize: 500 },
          variantB: { name: 'Question Format', performance: 1020, sampleSize: 500 },
          winner: 'B',
          improvement: 20,
          confidence: 88
        },
        {
          testType: 'posting_time',
          variantA: { name: '9:00 AM', performance: 1200, sampleSize: 300 },
          variantB: { name: '7:00 PM', performance: 1450, sampleSize: 300 },
          winner: 'B',
          improvement: 21,
          confidence: 92
        }
      ];

      setAbTestResults(abTests);
      
    } catch (error) {
      console.error('Error loading comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentSelection = (contentId: number) => {
    setSelectedContent(prev => {
      if (prev.includes(contentId)) {
        return prev.filter(id => id !== contentId);
      } else if (prev.length < 5) { // Limit to 5 comparisons
        return [...prev, contentId];
      }
      return prev;
    });
  };

  const getSelectedContentData = () => {
    return contentData.filter(content => selectedContent.includes(content.contentId));
  };

  const formatMetricValue = (value: number, metric: string): string => {
    switch (metric) {
      case 'views':
        return value.toLocaleString();
      case 'earnings':
        return `${value.toFixed(2)} LIB`;
      case 'engagement':
        return `${value.toFixed(1)}%`;
      case 'thumbnailCTR':
        return `${(value * 100).toFixed(2)}%`;
      case 'avgWatchTime':
        return `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`;
      case 'completionRate':
        return `${(value * 100).toFixed(1)}%`;
      case 'shareRate':
        return `${(value * 100).toFixed(2)}%`;
      default:
        return value.toString();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-border rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-border rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-satoshi font-bold">Content Performance Comparison</h2>
        <div className="flex gap-2">
          <select
            value={comparisonMetric}
            onChange={(e) => setComparisonMetric(e.target.value as any)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]"
          >
            <option value="views">Views</option>
            <option value="earnings">Earnings</option>
            <option value="engagement">Engagement</option>
          </select>
          <Button
            variant="secondary"
            onClick={loadComparisonData}
            className="text-sm min-h-[44px]"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Content Selection */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-lg font-satoshi font-bold mb-4">
          Select Content to Compare ({selectedContent.length}/5)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {contentData.slice(0, 10).map((content) => (
            <div
              key={content.contentId}
              onClick={() => handleContentSelection(content.contentId)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedContent.includes(content.contentId)
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <h4 className="font-medium text-sm truncate">{content.title}</h4>
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>{content.views.toLocaleString()} views</span>
                <span>{content.earnings.toFixed(2)} LIB</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Chart */}
      {selectedContent.length > 0 && (
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-lg font-satoshi font-bold mb-4">
            Performance Comparison - {comparisonMetric.charAt(0).toUpperCase() + comparisonMetric.slice(1)}
          </h3>
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <BarChart data={getSelectedContentData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#37373b" />
                <XAxis 
                  dataKey="title" 
                  stroke="#A0A0A0" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis stroke="#A0A0A0" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A1A1D', 
                    border: 'none', 
                    borderRadius: '10px' 
                  }}
                  formatter={(value: number) => [
                    formatMetricValue(value, comparisonMetric),
                    comparisonMetric.charAt(0).toUpperCase() + comparisonMetric.slice(1)
                  ]}
                />
                <Bar dataKey={comparisonMetric} fill="#FF0050" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Metrics Table */}
      {selectedContent.length > 0 && (
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-lg font-satoshi font-bold mb-4">Detailed Metrics Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2">Content</th>
                  <th className="text-right py-3 px-2">Views</th>
                  <th className="text-right py-3 px-2">Earnings</th>
                  <th className="text-right py-3 px-2">CTR</th>
                  <th className="text-right py-3 px-2">Watch Time</th>
                  <th className="text-right py-3 px-2">Completion</th>
                  <th className="text-right py-3 px-2">Share Rate</th>
                </tr>
              </thead>
              <tbody>
                {getSelectedContentData().map((content) => (
                  <tr key={content.contentId} className="border-b border-border/50">
                    <td className="py-3 px-2">
                      <div className="truncate max-w-[200px]">{content.title}</div>
                    </td>
                    <td className="text-right py-3 px-2">{formatMetricValue(content.views, 'views')}</td>
                    <td className="text-right py-3 px-2 text-green-400">
                      {formatMetricValue(content.earnings, 'earnings')}
                    </td>
                    <td className="text-right py-3 px-2">{formatMetricValue(content.thumbnailCTR, 'thumbnailCTR')}</td>
                    <td className="text-right py-3 px-2">{formatMetricValue(content.avgWatchTime, 'avgWatchTime')}</td>
                    <td className="text-right py-3 px-2">{formatMetricValue(content.completionRate, 'completionRate')}</td>
                    <td className="text-right py-3 px-2">{formatMetricValue(content.shareRate, 'shareRate')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* A/B Testing Results */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-lg font-satoshi font-bold mb-4">A/B Testing Insights</h3>
        <div className="space-y-4">
          {abTestResults.map((test, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                <h4 className="font-medium capitalize">
                  {test.testType.replace('_', ' ')} Test
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    test.winner === 'B' ? 'bg-green-500/20 text-green-400' :
                    test.winner === 'A' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {test.winner === 'inconclusive' ? 'Inconclusive' : `Variant ${test.winner} Wins`}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {test.confidence}% confidence
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Variant A: {test.variantA.name}</span>
                    <span className="text-sm font-medium">
                      {test.testType === 'thumbnail' 
                        ? `${(test.variantA.performance * 100).toFixed(2)}% CTR`
                        : test.variantA.performance.toLocaleString()
                      }
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div 
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ 
                        width: `${test.winner === 'A' ? 100 : 
                          (test.variantA.performance / Math.max(test.variantA.performance, test.variantB.performance)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Variant B: {test.variantB.name}</span>
                    <span className="text-sm font-medium">
                      {test.testType === 'thumbnail' 
                        ? `${(test.variantB.performance * 100).toFixed(2)}% CTR`
                        : test.variantB.performance.toLocaleString()
                      }
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div 
                      className="h-2 bg-green-500 rounded-full"
                      style={{ 
                        width: `${test.winner === 'B' ? 100 : 
                          (test.variantB.performance / Math.max(test.variantA.performance, test.variantB.performance)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {test.winner !== 'inconclusive' && (
                <div className="mt-3 p-3 bg-background/30 rounded-lg">
                  <p className="text-sm text-green-400">
                    <strong>Result:</strong> Variant {test.winner} performed {test.improvement}% better
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Optimization Recommendations */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-lg font-satoshi font-bold mb-4">Optimization Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-green-400">What's Working Well</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Bright, colorful thumbnails increase CTR by 25%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Question-format titles boost engagement by 20%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Evening posts (7 PM) get 21% more views</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-yellow-400">Areas for Improvement</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-sm">Test longer video formats for higher earnings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-sm">Experiment with different thumbnail styles</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-sm">Try posting at different times of day</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentPerformanceComparison;