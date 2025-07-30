import { AnalyticsService, VideoAnalytics, DateRange } from '../types/promotional-video';

interface AnalyticsEvent {
  id: string;
  videoId: string;
  eventType: 'impression' | 'interaction' | 'completion' | 'click';
  deviceType: string;
  timestamp: Date;
  sessionId: string;
  additionalData?: Record<string, any>;
}

class MockAnalyticsService implements AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  async trackImpression(videoId: string, deviceType: string): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      videoId,
      eventType: 'impression',
      deviceType,
      timestamp: new Date(),
      sessionId: this.sessionId
    };

    this.events.push(event);
    console.log('Analytics: Tracked impression', event);

    // In production, this would send to analytics backend
    await this.sendToAnalyticsBackend(event);
  }

  async trackInteraction(videoId: string, interactionType: string): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      videoId,
      eventType: 'interaction',
      deviceType: this.getDeviceType(),
      timestamp: new Date(),
      sessionId: this.sessionId,
      additionalData: { interactionType }
    };

    this.events.push(event);
    console.log('Analytics: Tracked interaction', event);

    await this.sendToAnalyticsBackend(event);
  }

  async trackCompletion(videoId: string, watchTime: number): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      videoId,
      eventType: 'completion',
      deviceType: this.getDeviceType(),
      timestamp: new Date(),
      sessionId: this.sessionId,
      additionalData: { watchTime }
    };

    this.events.push(event);
    console.log('Analytics: Tracked completion', event);

    await this.sendToAnalyticsBackend(event);
  }

  async trackClick(videoId: string, clickTarget: string): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      videoId,
      eventType: 'click',
      deviceType: this.getDeviceType(),
      timestamp: new Date(),
      sessionId: this.sessionId,
      additionalData: { clickTarget }
    };

    this.events.push(event);
    console.log('Analytics: Tracked click', event);

    await this.sendToAnalyticsBackend(event);
  }

  async getVideoAnalytics(videoId: string, dateRange: DateRange): Promise<VideoAnalytics> {
    const videoEvents = this.events.filter(event => 
      event.videoId === videoId &&
      event.timestamp >= dateRange.startDate &&
      event.timestamp <= dateRange.endDate
    );

    const impressions = videoEvents.filter(e => e.eventType === 'impression').length;
    const completions = videoEvents.filter(e => e.eventType === 'completion').length;
    const clicks = videoEvents.filter(e => e.eventType === 'click').length;
    const interactions = videoEvents.filter(e => e.eventType === 'interaction').length;

    // Calculate device breakdown
    const deviceBreakdown = {
      desktop: videoEvents.filter(e => e.deviceType === 'desktop').length,
      mobile: videoEvents.filter(e => e.deviceType === 'mobile').length,
      tablet: videoEvents.filter(e => e.deviceType === 'tablet').length
    };

    // Calculate average view time from completion events
    const completionEvents = videoEvents.filter(e => e.eventType === 'completion');
    const totalWatchTime = completionEvents.reduce((sum, event) => {
      return sum + (event.additionalData?.watchTime || 0);
    }, 0);
    const averageViewTime = completionEvents.length > 0 ? totalWatchTime / completionEvents.length : 0;

    // Calculate rates
    const completionRate = impressions > 0 ? (completions / impressions) * 100 : 0;
    const clickThroughRate = impressions > 0 ? (clicks / impressions) * 100 : 0;

    // Calculate performance score (weighted combination of metrics)
    const performanceScore = this.calculatePerformanceScore({
      impressions,
      completionRate,
      clickThroughRate,
      averageViewTime,
      deviceBreakdown,
      performanceScore: 0 // Will be calculated
    });

    return {
      impressions,
      completionRate,
      clickThroughRate,
      averageViewTime,
      deviceBreakdown,
      performanceScore
    };
  }

  async exportAnalytics(format: 'csv' | 'json'): Promise<Blob> {
    const data = this.events.map(event => ({
      id: event.id,
      videoId: event.videoId,
      eventType: event.eventType,
      deviceType: event.deviceType,
      timestamp: event.timestamp.toISOString(),
      sessionId: event.sessionId,
      ...event.additionalData
    }));

    if (format === 'csv') {
      return this.exportToCsv(data);
    } else {
      return this.exportToJson(data);
    }
  }

  // Get aggregated analytics for all videos
  async getAllVideoAnalytics(dateRange: DateRange): Promise<Record<string, VideoAnalytics>> {
    const videoIds = [...new Set(this.events.map(e => e.videoId))];
    const analytics: Record<string, VideoAnalytics> = {};

    for (const videoId of videoIds) {
      analytics[videoId] = await this.getVideoAnalytics(videoId, dateRange);
    }

    return analytics;
  }

  // Get real-time analytics
  async getRealTimeAnalytics(): Promise<{
    activeUsers: number;
    currentImpressions: number;
    topPerformingVideo: string | null;
  }> {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const recentEvents = this.events.filter(e => e.timestamp >= fiveMinutesAgo);
    const activeSessions = new Set(recentEvents.map(e => e.sessionId));
    const recentImpressions = recentEvents.filter(e => e.eventType === 'impression');

    // Find top performing video in the last hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const hourlyEvents = this.events.filter(e => e.timestamp >= oneHourAgo);
    const videoPerformance = new Map<string, number>();

    hourlyEvents.forEach(event => {
      const current = videoPerformance.get(event.videoId) || 0;
      videoPerformance.set(event.videoId, current + 1);
    });

    const topPerformingVideo = videoPerformance.size > 0 
      ? [...videoPerformance.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : null;

    return {
      activeUsers: activeSessions.size,
      currentImpressions: recentImpressions.length,
      topPerformingVideo
    };
  }

  // Private helper methods
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private calculatePerformanceScore(analytics: VideoAnalytics): number {
    // Weighted performance score calculation
    const impressionWeight = 0.2;
    const completionWeight = 0.4;
    const clickWeight = 0.3;
    const viewTimeWeight = 0.1;

    // Normalize metrics to 0-100 scale
    const normalizedImpressions = Math.min(analytics.impressions / 1000, 1) * 100;
    const normalizedCompletion = analytics.completionRate;
    const normalizedClick = analytics.clickThroughRate;
    const normalizedViewTime = Math.min(analytics.averageViewTime / 60, 1) * 100; // Assume 60s is max

    const score = (
      normalizedImpressions * impressionWeight +
      normalizedCompletion * completionWeight +
      normalizedClick * clickWeight +
      normalizedViewTime * viewTimeWeight
    );

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  private async sendToAnalyticsBackend(event: AnalyticsEvent): Promise<void> {
    // In production, this would send to your analytics backend
    // For now, just simulate the API call
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private exportToCsv(data: any[]): Blob {
    if (data.length === 0) {
      return new Blob(['No data available'], { type: 'text/csv' });
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(','))
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  }

  private exportToJson(data: any[]): Blob {
    const jsonContent = JSON.stringify(data, null, 2);
    return new Blob([jsonContent], { type: 'application/json' });
  }

  // Development helper - get all events for debugging
  getAllEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Clear all analytics data (for testing)
  clearAllData(): void {
    this.events = [];
    this.sessionId = this.generateSessionId();
  }
}

// Export singleton instance
export const analyticsService = new MockAnalyticsService();