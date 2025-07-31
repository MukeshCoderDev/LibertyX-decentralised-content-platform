/**
 * @vitest-environment jsdom
 */

// import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PromotionalVideoBackground from '../components/PromotionalVideoBackground';
import { promotionalVideoService } from '../lib/promotionalVideoService';
import { performanceService } from '../lib/performanceService';

// Mock the services
vi.mock('../lib/promotionalVideoService');
vi.mock('../lib/performanceService');
vi.mock('../lib/analyticsService');

const mockPromotionalVideoService = vi.mocked(promotionalVideoService);
const mockPerformanceService = vi.mocked(performanceService);

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'load', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

describe('PromotionalVideoBackground', () => {
  const mockVideo = {
    id: 'test-video-1',
    title: 'Test Video',
    description: 'A test promotional video',
    videoUrl: 'https://example.com/video.mp4',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    fileSize: 1024000,
    duration: 60,
    format: 'mp4' as const,
    isActive: true,
    priority: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    analytics: {
      impressions: 0,
      completionRate: 0,
      clickThroughRate: 0,
      averageViewTime: 0,
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
      performanceScore: 0,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockPerformanceService.getOptimalVideoSettings.mockReturnValue({
      deviceType: 'desktop',
      connectionSpeed: 'fast',
      shouldAutoplay: true,
      recommendedQuality: 'high',
      preloadStrategy: 'auto',
    });

    mockPerformanceService.getOptimizedVideoUrl.mockReturnValue('https://example.com/optimized-video.mp4');
  });

  it('should render loading state initially', () => {
    mockPromotionalVideoService.getCurrentVideo.mockResolvedValue(null);
    
    render(<PromotionalVideoBackground />);
    
    // Should show loading indicator
    expect(document.querySelector('[style*="spin"]')).toBeInTheDocument();
  });

  it('should load and display a promotional video', async () => {
    mockPromotionalVideoService.getCurrentVideo.mockResolvedValue(mockVideo);
    
    const onVideoLoad = vi.fn();
    render(<PromotionalVideoBackground onVideoLoad={onVideoLoad} />);
    
    await waitFor(() => {
      expect(mockPromotionalVideoService.getCurrentVideo).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(onVideoLoad).toHaveBeenCalledWith(mockVideo);
    });
  });

  it('should handle video loading errors gracefully', async () => {
    mockPromotionalVideoService.getCurrentVideo.mockRejectedValue(new Error('Network error'));
    
    const onVideoError = vi.fn();
    render(<PromotionalVideoBackground onVideoError={onVideoError} />);
    
    await waitFor(() => {
      expect(onVideoError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('should use fallback when no videos are available', async () => {
    mockPromotionalVideoService.getCurrentVideo.mockResolvedValue(null);
    
    const onVideoError = vi.fn();
    render(<PromotionalVideoBackground onVideoError={onVideoError} />);
    
    await waitFor(() => {
      expect(onVideoError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No active promotional videos available',
        })
      );
    });
  });

  it('should respect performance settings for video playback', async () => {
    mockPerformanceService.getOptimalVideoSettings.mockReturnValue({
      deviceType: 'mobile',
      connectionSpeed: 'slow',
      shouldAutoplay: false,
      recommendedQuality: 'low',
      preloadStrategy: 'none',
    });

    mockPromotionalVideoService.getCurrentVideo.mockResolvedValue(mockVideo);
    
    render(<PromotionalVideoBackground />);
    
    await waitFor(() => {
      expect(mockPerformanceService.getOptimalVideoSettings).toHaveBeenCalled();
    });
  });

  it('should handle video timeout', async () => {
    vi.useFakeTimers();
    
    // Mock a slow-loading video
    mockPromotionalVideoService.getCurrentVideo.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockVideo), 10000))
    );
    
    const onVideoError = vi.fn();
    render(<PromotionalVideoBackground onVideoError={onVideoError} />);
    
    // Fast-forward time to trigger timeout
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(onVideoError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Video loading timeout',
        })
      );
    });
    
    vi.useRealTimers();
  });

  it('should rotate videos when multiple are available', async () => {
    const video2 = { ...mockVideo, id: 'test-video-2', title: 'Test Video 2' };
    
    mockPromotionalVideoService.getCurrentVideo.mockResolvedValue(mockVideo);
    mockPromotionalVideoService.getNextVideo.mockResolvedValue(video2);
    
    const onVideoLoad = vi.fn();
    render(<PromotionalVideoBackground onVideoLoad={onVideoLoad} />);
    
    // Wait for initial video load
    await waitFor(() => {
      expect(onVideoLoad).toHaveBeenCalledWith(mockVideo);
    });
    
    // The component should set up rotation interval
    expect(mockPromotionalVideoService.getNextVideo).toHaveBeenCalledWith(mockVideo.id);
  });

  it('should apply correct CSS styles for video background', async () => {
    mockPromotionalVideoService.getCurrentVideo.mockResolvedValue(mockVideo);
    
    render(<PromotionalVideoBackground />);
    
    await waitFor(() => {
      const videoContainer = document.querySelector('[style*="position: absolute"]');
      expect(videoContainer).toBeInTheDocument();
      expect(videoContainer).toHaveStyle({
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '0',
      });
    });
  });
});