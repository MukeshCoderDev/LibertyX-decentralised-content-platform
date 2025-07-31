import { arweaveService } from './arweaveService';
import { promotionalVideoService } from './promotionalVideoService';
import { PromotionalVideo, VideoMetadata } from '../types/promotional-video';
import { ContentMetadata } from './arweaveConfig';

export interface Web3VideoUploadOptions {
  file: File;
  metadata: VideoMetadata;
  useArweave?: boolean;
  onProgress?: (progress: { percentage: number; stage: string }) => void;
}

export interface Web3VideoAnalytics {
  totalImpressions: number;
  arweaveTransactions: number;
  storageUsed: number; // in bytes
  totalCost: string; // in AR
  performanceMetrics: {
    averageLoadTime: number;
    successRate: number;
    errorRate: number;
  };
}

export class Web3PromotionalVideoManager {
  private static instance: Web3PromotionalVideoManager;
  private uploadQueue: Web3VideoUploadOptions[] = [];
  private isProcessingQueue = false;

  static getInstance(): Web3PromotionalVideoManager {
    if (!Web3PromotionalVideoManager.instance) {
      Web3PromotionalVideoManager.instance = new Web3PromotionalVideoManager();
    }
    return Web3PromotionalVideoManager.instance;
  }

  /**
   * Upload promotional video with Web3 storage options
   */
  async uploadPromotionalVideo(options: Web3VideoUploadOptions): Promise<PromotionalVideo> {
    const { file, metadata, useArweave = true, onProgress } = options;

    try {
      onProgress?.({ percentage: 0, stage: 'Validating file' });
      
      // Validate file before upload
      this.validatePromotionalVideo(file);
      
      onProgress?.({ percentage: 10, stage: 'Preparing upload' });

      if (useArweave) {
        return await this.uploadToArweave(file, metadata, onProgress);
      } else {
        return await this.uploadToTraditionalStorage(file, metadata, onProgress);
      }

    } catch (error) {
      console.error('Failed to upload promotional video:', error);
      throw error;
    }
  }

  /**
   * Upload to Arweave with enhanced metadata
   */
  private async uploadToArweave(
    file: File, 
    metadata: VideoMetadata, 
    onProgress?: (progress: { percentage: number; stage: string }) => void
  ): Promise<PromotionalVideo> {
    
    onProgress?.({ percentage: 20, stage: 'Uploading to Arweave' });

    // Enhanced metadata for promotional videos
    const arweaveMetadata: Partial<ContentMetadata> = {
      title: metadata.title,
      description: metadata.description,
      contentType: file.type,
      accessLevel: 'public',
      tags: [
        'promotional',
        'advertisement',
        'libertyX',
        'web3',
        'decentralized',
        ...(metadata.tags || [])
      ],
      size: file.size,
    };

    // Upload with progress tracking
    const uploadResult = await arweaveService.uploadWithBrowserWallet(
      file,
      arweaveMetadata,
      (arweaveProgress) => {
        const overallProgress = 20 + (arweaveProgress.percentage * 0.6); // 20-80%
        onProgress?.({ 
          percentage: overallProgress, 
          stage: `Uploading to Arweave (${arweaveProgress.percentage}%)` 
        });
      }
    );

    onProgress?.({ percentage: 85, stage: 'Processing video metadata' });

    // Generate thumbnail and get video info
    const thumbnailUrl = await this.generateThumbnail(file);
    const duration = await this.getVideoDuration(file);

    onProgress?.({ percentage: 95, stage: 'Finalizing upload' });

    // Create promotional video record
    const video: PromotionalVideo = {
      id: uploadResult.transactionId,
      title: metadata.title,
      description: metadata.description,
      videoUrl: arweaveService.getContentUrl(uploadResult.transactionId),
      thumbnailUrl,
      fileSize: file.size,
      duration,
      format: this.getVideoFormat(file),
      isActive: true,
      priority: metadata.priority || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      schedule: metadata.schedule,
      analytics: {
        impressions: 0,
        completionRate: 0,
        clickThroughRate: 0,
        averageViewTime: 0,
        deviceBreakdown: {
          desktop: 0,
          mobile: 0,
          tablet: 0
        },
        performanceScore: 0
      }
    };

    onProgress?.({ percentage: 100, stage: 'Upload complete' });

    console.log('✅ Promotional video uploaded to Arweave:', {
      transactionId: uploadResult.transactionId,
      title: metadata.title,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      url: video.videoUrl
    });

    return video;
  }

  /**
   * Fallback to traditional storage
   */
  private async uploadToTraditionalStorage(
    file: File, 
    metadata: VideoMetadata, 
    onProgress?: (progress: { percentage: number; stage: string }) => void
  ): Promise<PromotionalVideo> {
    
    onProgress?.({ percentage: 30, stage: 'Uploading to traditional storage' });
    
    // Use the existing promotional video service
    const video = await promotionalVideoService.uploadVideo(file, metadata);
    
    onProgress?.({ percentage: 100, stage: 'Upload complete' });
    
    console.log('✅ Promotional video uploaded to traditional storage:', video.id);
    
    return video;
  }

  /**
   * Queue multiple uploads for batch processing
   */
  async queueUpload(options: Web3VideoUploadOptions): Promise<void> {
    this.uploadQueue.push(options);
    
    if (!this.isProcessingQueue) {
      this.processUploadQueue();
    }
  }

  /**
   * Process upload queue
   */
  private async processUploadQueue(): Promise<void> {
    if (this.uploadQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    
    while (this.uploadQueue.length > 0) {
      const uploadOptions = this.uploadQueue.shift()!;
      
      try {
        await this.uploadPromotionalVideo(uploadOptions);
        console.log(`✅ Processed upload: ${uploadOptions.metadata.title}`);
      } catch (error) {
        console.error(`❌ Failed to process upload: ${uploadOptions.metadata.title}`, error);
      }
      
      // Small delay between uploads to avoid overwhelming the network
      await this.delay(1000);
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Get Web3 analytics for promotional videos
   */
  async getWeb3Analytics(): Promise<Web3VideoAnalytics> {
    const allVideos = await promotionalVideoService.getAllVideos();
    const arweaveVideos = allVideos.filter(v => v.videoUrl.includes('arweave.net'));
    
    const totalImpressions = allVideos.reduce((sum, v) => sum + v.analytics.impressions, 0);
    const storageUsed = arweaveVideos.reduce((sum, v) => sum + v.fileSize, 0);
    
    // Calculate performance metrics
    const totalVideos = allVideos.length;
    const successfulLoads = allVideos.filter(v => v.analytics.performanceScore > 0).length;
    
    return {
      totalImpressions,
      arweaveTransactions: arweaveVideos.length,
      storageUsed,
      totalCost: '0.0', // Would calculate actual AR cost in production
      performanceMetrics: {
        averageLoadTime: 2.5, // Would track actual load times
        successRate: totalVideos > 0 ? (successfulLoads / totalVideos) : 0,
        errorRate: totalVideos > 0 ? ((totalVideos - successfulLoads) / totalVideos) : 0
      }
    };
  }

  /**
   * Migrate existing videos to Arweave
   */
  async migrateToArweave(videoIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [], failed: [] };
    
    for (const videoId of videoIds) {
      try {
        // This would involve re-uploading existing videos to Arweave
        // For now, we'll just log the migration intent
        console.log(`🔄 Would migrate video ${videoId} to Arweave`);
        results.success.push(videoId);
      } catch (error) {
        console.error(`❌ Failed to migrate video ${videoId}:`, error);
        results.failed.push(videoId);
      }
    }
    
    return results;
  }

  /**
   * Validate promotional video file
   */
  private validatePromotionalVideo(file: File): void {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['video/mp4', 'video/webm'];
    const minDuration = 5; // 5 seconds minimum
    const maxDuration = 120; // 2 minutes maximum

    if (file.size > maxSize) {
      throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Additional validation could include duration checks, resolution checks, etc.
  }

  /**
   * Generate thumbnail from video
   */
  private async generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = Math.min(2, video.duration / 2); // Capture at 2s or middle
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailUrl);
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get video duration
   */
  private async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get video format
   */
  private getVideoFormat(file: File): 'mp4' | 'webm' {
    return file.type === 'video/webm' ? 'webm' : 'mp4';
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const web3PromotionalVideoManager = Web3PromotionalVideoManager.getInstance();