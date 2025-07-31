/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { promotionalVideoService } from '../lib/promotionalVideoService';
import { VideoMetadata } from '../types/promotional-video';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'duration', {
  writable: true,
  value: 60,
});

Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
  writable: true,
  value: 1920,
});

Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
  writable: true,
  value: 1080,
});

// Mock canvas context
const mockContext = {
  drawImage: vi.fn(),
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => mockContext,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: () => 'data:image/jpeg;base64,mock-thumbnail',
});

describe('PromotionalVideoService', () => {
  beforeEach(() => {
    // Clear any existing videos
    promotionalVideoService.clearAllData?.();
  });

  describe('uploadVideo', () => {
    it('should upload a video successfully', async () => {
      const mockFile = new File(['mock video content'], 'test.mp4', {
        type: 'video/mp4',
        lastModified: Date.now(),
      });

      const metadata: VideoMetadata = {
        title: 'Test Video',
        description: 'A test video',
        priority: 5,
      };

      const uploadedVideo = await promotionalVideoService.uploadVideo(mockFile, metadata);

      expect(uploadedVideo).toBeDefined();
      expect(uploadedVideo.title).toBe('Test Video');
      expect(uploadedVideo.description).toBe('A test video');
      expect(uploadedVideo.priority).toBe(5);
      expect(uploadedVideo.format).toBe('mp4');
      expect(uploadedVideo.isActive).toBe(true);
    });

    it('should reject files that are too large', async () => {
      const mockFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.mp4', {
        type: 'video/mp4',
      });

      const metadata: VideoMetadata = {
        title: 'Large Video',
        description: 'Too large',
      };

      await expect(promotionalVideoService.uploadVideo(mockFile, metadata))
        .rejects
        .toThrow('File size');
    });

    it('should reject unsupported file types', async () => {
      const mockFile = new File(['mock content'], 'test.avi', {
        type: 'video/avi',
      });

      const metadata: VideoMetadata = {
        title: 'Unsupported Video',
        description: 'Wrong format',
      };

      await expect(promotionalVideoService.uploadVideo(mockFile, metadata))
        .rejects
        .toThrow('File type');
    });
  });

  describe('getCurrentVideo', () => {
    it('should return null when no videos are available', async () => {
      const currentVideo = await promotionalVideoService.getCurrentVideo();
      expect(currentVideo).toBeNull();
    });

    it('should return the highest priority active video', async () => {
      // Upload multiple videos with different priorities
      const file1 = new File(['content1'], 'video1.mp4', { type: 'video/mp4' });
      const file2 = new File(['content2'], 'video2.mp4', { type: 'video/mp4' });

      await promotionalVideoService.uploadVideo(file1, {
        title: 'Video 1',
        description: 'Lower priority',
        priority: 1,
      });

      await promotionalVideoService.uploadVideo(file2, {
        title: 'Video 2',
        description: 'Higher priority',
        priority: 10,
      });

      const currentVideo = await promotionalVideoService.getCurrentVideo();
      expect(currentVideo?.title).toBe('Video 2');
      expect(currentVideo?.priority).toBe(10);
    });
  });

  describe('toggleVideoStatus', () => {
    it('should toggle video active status', async () => {
      const mockFile = new File(['content'], 'test.mp4', { type: 'video/mp4' });
      const uploadedVideo = await promotionalVideoService.uploadVideo(mockFile, {
        title: 'Test Video',
        description: 'Test',
      });

      expect(uploadedVideo.isActive).toBe(true);

      await promotionalVideoService.toggleVideoStatus(uploadedVideo.id, false);
      
      const videos = await promotionalVideoService.getAllVideos();
      const updatedVideo = videos.find(v => v.id === uploadedVideo.id);
      expect(updatedVideo?.isActive).toBe(false);
    });
  });

  describe('deleteVideo', () => {
    it('should delete a video', async () => {
      const mockFile = new File(['content'], 'test.mp4', { type: 'video/mp4' });
      const uploadedVideo = await promotionalVideoService.uploadVideo(mockFile, {
        title: 'Test Video',
        description: 'Test',
      });

      await promotionalVideoService.deleteVideo(uploadedVideo.id);
      
      const videos = await promotionalVideoService.getAllVideos();
      expect(videos.find(v => v.id === uploadedVideo.id)).toBeUndefined();
    });

    it('should throw error when deleting non-existent video', async () => {
      await expect(promotionalVideoService.deleteVideo('non-existent'))
        .rejects
        .toThrow('not found');
    });
  });
});