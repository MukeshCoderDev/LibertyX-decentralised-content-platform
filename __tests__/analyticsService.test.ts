/**
 * @jest-environment jsdom
 */

import { analyticsService } from '../lib/analyticsService';

describe('AnalyticsService', () => {
  beforeEach(() => {
    // Clear analytics data before each test
    analyticsService.clearAllData();
  });

  describe('trackImpression', () => {
    it('should track video impressions', async () => {
      await analyticsService.trackImpression('video1', 'desktop');
      
      const analytics = await analyticsService.getVideoAnalytics('video1', {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(analytics.impressions).toBe(1);
      expect(analytics.deviceBreakdown.desktop).toBe(1);
      expect(analytics.deviceBreakdown.mobile).toBe(0);
    });

    it('should track multiple impressions', async () => {
      await analyticsService.trackImpression('video1', 'desktop');
      await analyticsService.trackImpression('video1', 'mobile');
      await analyticsService.trackImpression('video1', 'desktop');
      
      const analytics = await analyticsService.getVideoAnalytics('video1', {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(analytics.impressions).toBe(3);
      expect(analytics.deviceBreakdown.desktop).toBe(2);
      expect(analytics.deviceBreakdown.mobile).toBe(1);
    });
  });

  describe('trackInteraction', () => {
    it('should track video interactions', async () => {
      await analyticsService.trackImpression('video1', 'desktop');
      await analyticsService.trackInteraction('video1', 'play');
      
      const events = analyticsService.getAllEvents();
      const interactionEvents = events.filter(e => e.eventType === 'interaction');
      
      expect(interactionEvents).toHaveLength(1);
      expect(interactionEvents[0].additionalData?.interactionType).toBe('play');
    });
  });

  describe('trackClick', () => {
    it('should track click events and calculate CTR', async () => {
      // Track impressions and clicks
      await analyticsService.trackImpression('video1', 'desktop');
      await analyticsService.trackImpression('video1', 'desktop');
      await analyticsService.trackClick('video1', 'cta_button');
      
      const analytics = await analyticsService.getVideoAnalytics('video1', {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(analytics.impressions).toBe(2);
      expect(analytics.clickThroughRate).toBe(50); // 1 click / 2 impressions = 50%
    });
  });

  describe('trackCompletion', () => {
    it('should track video completions and calculate completion rate', async () => {
      await analyticsService.trackImpression('video1', 'desktop');
      await analyticsService.trackImpression('video1', 'desktop');
      await analyticsService.trackCompletion('video1', 45); // 45 seconds watch time
      
      const analytics = await analyticsService.getVideoAnalytics('video1', {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(analytics.impressions).toBe(2);
      expect(analytics.completionRate).toBe(50); // 1 completion / 2 impressions = 50%
      expect(analytics.averageViewTime).toBe(45);
    });
  });

  describe('exportAnalytics', () => {
    it('should export analytics as CSV', async () => {
      await analyticsService.trackImpression('video1', 'desktop');
      
      const csvBlob = await analyticsService.exportAnalytics('csv');
      expect(csvBlob.type).toBe('text/csv');
      
      const csvText = await csvBlob.text();
      expect(csvText).toContain('id,videoId,eventType');
      expect(csvText).toContain('video1,impression');
    });

    it('should export analytics as JSON', async () => {
      await analyticsService.trackImpression('video1', 'desktop');
      
      const jsonBlob = await analyticsService.exportAnalytics('json');
      expect(jsonBlob.type).toBe('application/json');
      
      const jsonText = await jsonBlob.text();
      const data = JSON.parse(jsonText);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('videoId', 'video1');
      expect(data[0]).toHaveProperty('eventType', 'impression');
    });
  });

  describe('getRealTimeAnalytics', () => {
    it('should return real-time analytics', async () => {
      await analyticsService.trackImpression('video1', 'desktop');
      await analyticsService.trackImpression('video2', 'mobile');
      
      const realTime = await analyticsService.getRealTimeAnalytics();
      
      expect(realTime.activeUsers).toBeGreaterThan(0);
      expect(realTime.currentImpressions).toBeGreaterThan(0);
      expect(realTime.topPerformingVideo).toBeDefined();
    });
  });

  describe('performance score calculation', () => {
    it('should calculate performance score based on metrics', async () => {
      // Create a video with good performance metrics
      await analyticsService.trackImpression('video1', 'desktop');
      await analyticsService.trackImpression('video1', 'desktop');
      await analyticsService.trackCompletion('video1', 50);
      await analyticsService.trackClick('video1', 'cta');
      
      const analytics = await analyticsService.getVideoAnalytics('video1', {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(analytics.performanceScore).toBeGreaterThan(0);
      expect(analytics.performanceScore).toBeLessThanOrEqual(100);
    });
  });
});