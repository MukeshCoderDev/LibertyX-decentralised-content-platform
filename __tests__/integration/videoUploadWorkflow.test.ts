/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { promotionalVideoService } from '../../lib/promotionalVideoService';
import { analyticsService } from '../../lib/analyticsService';
import { VideoMetadata } from '../../types/promotional-video';

describe('Video Upload and Display Workflow', () => {
  beforeEach(() => {
    // Clear all data before each test
    promotionalVideoService.clearAllData?.();
    analyticsService.clearAllData();
  });

  it('should complete full video upload and display workflow', async () => {
    // Step 1: Upload a video
    const mockFile = new File(['mock video content'], 'promotional.mp4', {
      type: 'video/mp4',
      lastModified: Date.now(),
    });

    const metadata: VideoMetadata = {
      title: 'LibertyX Platform Demo',
      description: 'Showcasing the main features of LibertyX',
      priority: 10,
    };

    const uploadedVideo = await promotionalVideoService.uploadVideo(mockFile, metadata);
    
    expect(uploadedVideo).toBeDefined();
    expect(uploadedVideo.title).toBe('LibertyX Platform Demo');
    expect(uploadedVideo.isActive).toBe(true);

    // Step 2: Verify video appears in current video selection
    const currentVideo = await promotionalVideoService.getCurrentVideo();
    expect(currentVideo).toBeDefined();
    expect(currentVideo?.id).toBe(uploadedVideo.id);

    // Step 3: Track analytics events
    await analyticsService.trackImpression(uploadedVideo.id, 'desktop');
    await analyticsService.trackInteraction(uploadedVideo.id, 'play');
    await analyticsService.trackCompletion(uploadedVideo.id, 45);

    // Step 4: Verify analytics data
    const analytics = await analyticsService.getVideoAnalytics(uploadedVideo.id, {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });

    expect(analytics.impressions).toBe(1);
    expect(analytics.completionRate).toBe(100); // 1 completion / 1 impression
    expect(analytics.averageViewTime).toBe(45);

    // Step 5: Test video management operations
    await promotionalVideoService.toggleVideoStatus(uploadedVideo.id, false);
    
    const inactiveVideo = await promotionalVideoService.getCurrentVideo();
    expect(inactiveVideo).toBeNull(); // Should be null since video is inactive

    // Reactivate video
    await promotionalVideoService.toggleVideoStatus(uploadedVideo.id, true);
    
    const reactivatedVideo = await promotionalVideoService.getCurrentVideo();
    expect(reactivatedVideo?.id).toBe(uploadedVideo.id);
  });

  it('should handle multiple videos with priority ordering', async () => {
    // Upload multiple videos with different priorities
    const videos = [
      { title: 'Low Priority Video', priority: 1 },
      { title: 'High Priority Video', priority: 10 },
      { title: 'Medium Priority Video', priority: 5 },
    ];

    const uploadedVideos = [];
    
    for (const videoData of videos) {
      const mockFile = new File(['content'], `${videoData.title}.mp4`, {
        type: 'video/mp4',
      });

      const uploaded = await promotionalVideoService.uploadVideo(mockFile, {
        title: videoData.title,
        description: 'Test video',
        priority: videoData.priority,
      });

      uploadedVideos.push(uploaded);
    }

    // Current video should be the highest priority one
    const currentVideo = await promotionalVideoService.getCurrentVideo();
    expect(currentVideo?.title).toBe('High Priority Video');
    expect(currentVideo?.priority).toBe(10);

    // Test video rotation
    const nextVideo = await promotionalVideoService.getNextVideo(currentVideo?.id);
    expect(nextVideo).toBeDefined();
    expect(nextVideo?.id).not.toBe(currentVideo?.id);
  });

  it('should handle video scheduling workflow', async () => {
    const mockFile = new File(['content'], 'scheduled.mp4', {
      type: 'video/mp4',
    });

    // Upload video with future schedule
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    const endDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // Day after tomorrow

    const uploadedVideo = await promotionalVideoService.uploadVideo(mockFile, {
      title: 'Scheduled Video',
      description: 'This video is scheduled for the future',
      schedule: {
        startDate: futureDate,
        endDate: endDate,
        timezone: 'UTC',
        isRecurring: false,
      },
    });

    // Video should not be current since it's scheduled for the future
    const currentVideo = await promotionalVideoService.getCurrentVideo();
    expect(currentVideo).toBeNull();

    // Update schedule to current time
    const now = new Date();
    await promotionalVideoService.updateVideo(uploadedVideo.id, {
      schedule: {
        startDate: now,
        endDate: endDate,
        timezone: 'UTC',
        isRecurring: false,
      },
    });

    // Now video should be current
    const currentVideoAfterUpdate = await promotionalVideoService.getCurrentVideo();
    expect(currentVideoAfterUpdate?.id).toBe(uploadedVideo.id);
  });

  it('should handle error scenarios gracefully', async () => {
    // Test file size validation
    const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.mp4', {
      type: 'video/mp4',
    });

    await expect(
      promotionalVideoService.uploadVideo(largeFile, {
        title: 'Large Video',
        description: 'Too large',
      })
    ).rejects.toThrow();

    // Test invalid file type
    const invalidFile = new File(['content'], 'video.avi', {
      type: 'video/avi',
    });

    await expect(
      promotionalVideoService.uploadVideo(invalidFile, {
        title: 'Invalid Video',
        description: 'Wrong format',
      })
    ).rejects.toThrow();

    // Test operations on non-existent video
    await expect(
      promotionalVideoService.deleteVideo('non-existent-id')
    ).rejects.toThrow();

    await expect(
      promotionalVideoService.updateVideo('non-existent-id', { title: 'Updated' })
    ).rejects.toThrow();
  });

  it('should export and import analytics data', async () => {
    // Upload a video and generate some analytics
    const mockFile = new File(['content'], 'analytics-test.mp4', {
      type: 'video/mp4',
    });

    const uploadedVideo = await promotionalVideoService.uploadVideo(mockFile, {
      title: 'Analytics Test Video',
      description: 'For testing analytics export',
    });

    // Generate analytics events
    await analyticsService.trackImpression(uploadedVideo.id, 'desktop');
    await analyticsService.trackImpression(uploadedVideo.id, 'mobile');
    await analyticsService.trackClick(uploadedVideo.id, 'cta_button');
    await analyticsService.trackCompletion(uploadedVideo.id, 30);

    // Export as CSV
    const csvBlob = await analyticsService.exportAnalytics('csv');
    expect(csvBlob.type).toBe('text/csv');
    
    const csvText = await csvBlob.text();
    expect(csvText).toContain('impression');
    expect(csvText).toContain('click');
    expect(csvText).toContain('completion');

    // Export as JSON
    const jsonBlob = await analyticsService.exportAnalytics('json');
    expect(jsonBlob.type).toBe('application/json');
    
    const jsonText = await jsonBlob.text();
    const data = JSON.parse(jsonText);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });
});