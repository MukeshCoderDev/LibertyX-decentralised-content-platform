import React, { useState, useEffect } from 'react';
import { VideoAnalytics, DateRange } from '../../types/promotional-video';
import { analyticsService } from '../../lib/analyticsService';
import { promotionalVideoService } from '../../lib/promotionalVideoService';

interface AnalyticsDashboardProps {
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const [analytics, setAnalytics] = useState<Record<string, VideoAnalytics>>({});
  const [videoTitles, setVideoTitles] = useState<Record<string, string>>({});
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date()
  });
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 0,
    currentImpressions: 0,
    topPerformingVideo: null as string | null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<keyof VideoAnalytics>('impressions');

  useEffect(() => {
    loadAnalytics();
    loadRealTimeData();
    
    // Update real-time data every 30 seconds
    const interval = setInterval(loadRealTimeData, 30000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Load video analytics
      const analyticsData = await analyticsService.getAllVideoAnalytics(dateRange);
      setAnalytics(analyticsData);
      
      // Load video titles
      const videos = await promotionalVideoService.getAllVideos();
      const titles: Record<string, string> = {};
      videos.forEach(video => {
        titles[video.id] = video.title;
      });
      setVideoTitles(titles);
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRealTimeData = async () => {
    try {
      const realTime = await analyticsService.getRealTimeAnalytics();
      setRealTimeData(realTime);
    } catch (error) {
      console.error('Failed to load real-time data:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const blob = await analyticsService.exportAnalytics(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string): Date => {
    return new Date(dateString);
  };

  const getTopVideos = (metric: keyof VideoAnalytics) => {
    return Object.entries(analytics)
      .map(([videoId, data]) => ({
        videoId,
        title: videoTitles[videoId] || 'Unknown Video',
        value: data[metric]
      }))
      .sort((a, b) => {
        if (typeof a.value === 'number' && typeof b.value === 'number') {
          return b.value - a.value;
        }
        return 0;
      })
      .slice(0, 5);
  };

  const getTotalMetrics = () => {
    const totals = {
      impressions: 0,
      completions: 0,
      clicks: 0,
      avgPerformance: 0
    };

    const videoCount = Object.keys(analytics).length;
    let totalPerformance = 0;

    Object.values(analytics).forEach(data => {
      totals.impressions += data.impressions;
      totals.completions += Math.round((data.completionRate / 100) * data.impressions);
      totals.clicks += Math.round((data.clickThroughRate / 100) * data.impressions);
      totalPerformance += data.performanceScore;
    });

    totals.avgPerformance = videoCount > 0 ? totalPerformance / videoCount : 0;

    return totals;
  };

  const renderMetricCard = (title: string, value: string | number, subtitle?: string, color?: string) => (
    <div style={{
      backgroundColor: 'var(--background-secondary, #1f2937)',
      border: '1px solid var(--border, #374151)',
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h3 style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        color: color || 'var(--primary, #007bff)', 
        marginBottom: '4px' 
      }}>
        {value}
      </h3>
      <p style={{ color: 'var(--text-primary, #fff)', fontWeight: 'bold', marginBottom: '2px' }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ color: 'var(--text-secondary, #888)', fontSize: '14px' }}>
          {subtitle}
        </p>
      )}
    </div>
  );

  const renderChart = () => {
    const topVideos = getTopVideos(selectedMetric);
    const maxValue = Math.max(...topVideos.map(v => typeof v.value === 'number' ? v.value : 0));

    return (
      <div style={{ marginTop: '16px' }}>
        {topVideos.map((video, index) => (
          <div key={video.videoId} style={{ marginBottom: '12px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{ color: 'var(--text-primary, #fff)', fontSize: '14px' }}>
                {video.title}
              </span>
              <span style={{ color: 'var(--text-secondary, #888)', fontSize: '14px' }}>
                {typeof video.value === 'number' ? video.value.toFixed(1) : 
                 typeof video.value === 'object' ? JSON.stringify(video.value) : 
                 String(video.value)}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--border, #374151)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${maxValue > 0 ? ((typeof video.value === 'number' ? video.value : 0) / maxValue) * 100 : 0}%`,
                height: '100%',
                backgroundColor: `hsl(${200 + index * 30}, 70%, 50%)`,
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const totals = getTotalMetrics();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }} className={className}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary, #fff)' }}>
          Analytics Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary, #888)' }}>
          Track performance and engagement metrics for promotional videos
        </p>
      </div>

      {/* Date Range Selector */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        alignItems: 'center', 
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary, #fff)' }}>
            Start Date
          </label>
          <input
            type="date"
            value={formatDate(dateRange.startDate)}
            onChange={(e) => setDateRange(prev => ({
              ...prev,
              startDate: parseDate(e.target.value)
            }))}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--background-secondary, #1f2937)',
              border: '1px solid var(--border, #374151)',
              borderRadius: '6px',
              color: 'var(--text-primary, #fff)'
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary, #fff)' }}>
            End Date
          </label>
          <input
            type="date"
            value={formatDate(dateRange.endDate)}
            onChange={(e) => setDateRange(prev => ({
              ...prev,
              endDate: parseDate(e.target.value)
            }))}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--background-secondary, #1f2937)',
              border: '1px solid var(--border, #374151)',
              borderRadius: '6px',
              color: 'var(--text-primary, #fff)'
            }}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleExport('csv')}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--primary, #007bff)',
              border: '1px solid var(--primary, #007bff)',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--primary, #007bff)',
              border: '1px solid var(--primary, #007bff)',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary, #fff)' }}>
          Real-time Overview
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {renderMetricCard('Active Users', realTimeData.activeUsers, 'Last 5 minutes', '#10b981')}
          {renderMetricCard('Current Impressions', realTimeData.currentImpressions, 'Last 5 minutes', '#f59e0b')}
          {renderMetricCard('Top Video', realTimeData.topPerformingVideo ? videoTitles[realTimeData.topPerformingVideo] || 'Unknown' : 'None', 'Most active', '#8b5cf6')}
        </div>
      </div>

      {/* Summary Metrics */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary, #fff)' }}>
          Summary ({formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)})
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {renderMetricCard('Total Impressions', totals.impressions.toLocaleString())}
          {renderMetricCard('Total Completions', totals.completions.toLocaleString())}
          {renderMetricCard('Total Clicks', totals.clicks.toLocaleString())}
          {renderMetricCard('Avg Performance', `${totals.avgPerformance.toFixed(1)}/100`)}
        </div>
      </div>

      {/* Detailed Analytics */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary, #fff)' }}>
            Top Performing Videos
          </h2>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--background-secondary, #1f2937)',
              border: '1px solid var(--border, #374151)',
              borderRadius: '6px',
              color: 'var(--text-primary, #fff)'
            }}
          >
            <option value="impressions">Impressions</option>
            <option value="completionRate">Completion Rate</option>
            <option value="clickThroughRate">Click-through Rate</option>
            <option value="performanceScore">Performance Score</option>
          </select>
        </div>

        <div style={{
          backgroundColor: 'var(--background-secondary, #1f2937)',
          border: '1px solid var(--border, #374151)',
          borderRadius: '8px',
          padding: '24px'
        }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary, #888)' }}>
              Loading analytics...
            </div>
          ) : Object.keys(analytics).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary, #888)' }}>
              No analytics data available for the selected date range
            </div>
          ) : (
            renderChart()
          )}
        </div>
      </div>

      {/* Detailed Table */}
      {!isLoading && Object.keys(analytics).length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary, #fff)' }}>
            Detailed Metrics
          </h2>
          <div style={{
            backgroundColor: 'var(--background-secondary, #1f2937)',
            border: '1px solid var(--border, #374151)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--background, #111827)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-primary, #fff)', borderBottom: '1px solid var(--border, #374151)' }}>Video</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary, #fff)', borderBottom: '1px solid var(--border, #374151)' }}>Impressions</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary, #fff)', borderBottom: '1px solid var(--border, #374151)' }}>Completion %</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary, #fff)', borderBottom: '1px solid var(--border, #374151)' }}>CTR %</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary, #fff)', borderBottom: '1px solid var(--border, #374151)' }}>Avg View Time</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary, #fff)', borderBottom: '1px solid var(--border, #374151)' }}>Performance</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics).map(([videoId, data]) => (
                  <tr key={videoId}>
                    <td style={{ padding: '12px', color: 'var(--text-primary, #fff)', borderBottom: '1px solid var(--border, #374151)' }}>
                      {videoTitles[videoId] || 'Unknown Video'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary, #888)', borderBottom: '1px solid var(--border, #374151)' }}>
                      {data.impressions.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary, #888)', borderBottom: '1px solid var(--border, #374151)' }}>
                      {data.completionRate.toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary, #888)', borderBottom: '1px solid var(--border, #374151)' }}>
                      {data.clickThroughRate.toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary, #888)', borderBottom: '1px solid var(--border, #374151)' }}>
                      {data.averageViewTime.toFixed(1)}s
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary, #888)', borderBottom: '1px solid var(--border, #374151)' }}>
                      {data.performanceScore.toFixed(1)}/100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;