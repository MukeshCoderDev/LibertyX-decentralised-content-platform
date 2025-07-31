import { 
  PromotionalVideo, 
  VideoMetadata, 
  PromotionalVideoService,
  VideoError,
  VideoErrorClass,
  RecurringPattern
} from '../types/promotional-video';
import { arweaveService } from './arweaveService';
import { ContentMetadata } from './arweaveConfig';

// Mock storage for development - in production this would connect to a real database
class MockPromotionalVideoService implements PromotionalVideoService {
  private videos: PromotionalVideo[] = [];
  private nextId = 1;

  async getCurrentVideo(): Promise<PromotionalVideo | null> {
    const activeVideos = await this.getActiveVideos();
    if (activeVideos.length === 0) return null;
    
    // Filter videos by current schedule
    const now = new Date();
    const scheduledVideos = activeVideos.filter(video => this.isVideoScheduledNow(video, now));
    
    if (scheduledVideos.length === 0) {
      // No scheduled videos, return highest priority active video
      return activeVideos[0];
    }
    
    // If multiple videos are scheduled, use rotation logic
    if (scheduledVideos.length > 1) {
      return this.getRotatedVideo(scheduledVideos);
    }
    
    return scheduledVideos[0];
  }

  private isVideoScheduledNow(video: PromotionalVideo, now: Date): boolean {
    if (!video.schedule) return true; // No schedule means always active
    
    const { startDate, endDate, isRecurring, recurringPattern } = video.schedule;
    
    // Check basic date range
    if (now < startDate || now > endDate) return false;
    
    // If not recurring, just check if we're in the date range
    if (!isRecurring) return true;
    
    // Handle recurring patterns
    if (recurringPattern) {
      return this.matchesRecurringPattern(now, recurringPattern);
    }
    
    return true;
  }

  private matchesRecurringPattern(date: Date, pattern: RecurringPattern): boolean {
    switch (pattern.type) {
      case 'daily':
        // Every N days
        return true; // For simplicity, assume daily patterns are always active
      
      case 'weekly':
        if (pattern.daysOfWeek) {
          const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          return pattern.daysOfWeek.includes(dayOfWeek);
        }
        return true;
      
      case 'monthly':
        // Every N months on the same day
        return true; // For simplicity, assume monthly patterns are always active
      
      default:
        return true;
    }
  }

  private getRotatedVideo(videos: PromotionalVideo[]): PromotionalVideo {
    // Sort by priority first
    const sortedVideos = videos.sort((a, b) => b.priority - a.priority);
    
    // Use a simple rotation based on current time
    // In production, this could be more sophisticated (e.g., based on user sessions)
    const rotationIndex = Math.floor(Date.now() / (1000 * 60 * 5)) % sortedVideos.length; // Rotate every 5 minutes
    
    return sortedVideos[rotationIndex];
  }

  async getActiveVideos(): Promise<PromotionalVideo[]> {
    return this.videos
      .filter(video => video.isActive)
      .sort((a, b) => b.priority - a.priority);
  }

  async uploadVideo(file: File, metadata: VideoMetadata): Promise<PromotionalVideo> {
    // Validate file
    this.validateVideoFile(file);
    
    try {
      // Upload to Arweave for permanent Web3 storage
      console.log('Uploading promotional video to Arweave...');
      
      const arweaveMetadata: Partial<ContentMetadata> = {
        title: metadata.title,
        description: metadata.description,
        contentType: file.type,
        accessLevel: 'public', // Promotional videos are always public
        tags: ['promotional', 'advertisement', 'libertyX'],
      };

      // Upload video to Arweave with progress tracking
      const uploadResult = await arweaveService.uploadWithBrowserWallet(
        file,
        arweaveMetadata,
        (progress) => {
          console.log(`Upload progress: ${progress.percentage}%`);
        }
      );

      // Generate Arweave URL
      const videoUrl = arweaveService.getContentUrl(uploadResult.transactionId);
      
      // Generate thumbnail (still local for now, could also be uploaded to Arweave)
      const thumbnailUrl = await this.generateThumbnail(file);
      
      const video: PromotionalVideo = {
        id: uploadResult.transactionId, // Use Arweave transaction ID as video ID
        title: metadata.title,
        description: metadata.description,
        videoUrl,
        thumbnailUrl,
        fileSize: file.size,
        duration: await this.getVideoDuration(file),
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

      this.videos.push(video);
      
      console.log('✅ Promotional video uploaded to Arweave:', uploadResult.transactionId);
      return video;
      
    } catch (error) {
      console.error('❌ Failed to upload promotional video to Arweave:', error);
      
      // Fallback to local storage for development
      console.log('Falling back to local storage...');
      const videoUrl = URL.createObjectURL(file);
      const thumbnailUrl = await this.generateThumbnail(file);
      
      const video: PromotionalVideo = {
        id: `video_${this.nextId++}`,
        title: metadata.title,
        description: metadata.description,
        videoUrl,
        thumbnailUrl,
        fileSize: file.size,
        duration: await this.getVideoDuration(file),
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

      this.videos.push(video);
      return video;
    }
  }

  async updateVideo(id: string, updates: Partial<PromotionalVideo>): Promise<PromotionalVideo> {
    const videoIndex = this.videos.findIndex(v => v.id === id);
    if (videoIndex === -1) {
      throw new Error(`Video with id ${id} not found`);
    }

    const updatedVideo = {
      ...this.videos[videoIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.videos[videoIndex] = updatedVideo;
    return updatedVideo;
  }

  async deleteVideo(id: string): Promise<void> {
    const videoIndex = this.videos.findIndex(v => v.id === id);
    if (videoIndex === -1) {
      throw new Error(`Video with id ${id} not found`);
    }

    // In production, this would also delete from cloud storage
    const video = this.videos[videoIndex];
    URL.revokeObjectURL(video.videoUrl);
    URL.revokeObjectURL(video.thumbnailUrl);
    
    this.videos.splice(videoIndex, 1);
  }

  async toggleVideoStatus(id: string, isActive: boolean): Promise<void> {
    await this.updateVideo(id, { isActive });
  }

  async getNextVideo(currentVideoId?: string): Promise<PromotionalVideo | null> {
    const activeVideos = await this.getActiveVideos();
    if (activeVideos.length === 0) return null;
    
    if (!currentVideoId || activeVideos.length === 1) {
      return this.getCurrentVideo();
    }
    
    const currentIndex = activeVideos.findIndex(v => v.id === currentVideoId);
    const nextIndex = (currentIndex + 1) % activeVideos.length;
    
    return activeVideos[nextIndex];
  }

  async getAllVideos(): Promise<PromotionalVideo[]> {
    return [...this.videos].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Utility methods
  private validateVideoFile(file: File): void {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['video/mp4', 'video/webm'];

    if (file.size > maxSize) {
      throw new VideoErrorClass({
        type: 'storage',
        message: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`
      });
    }

    if (!allowedTypes.includes(file.type)) {
      throw new VideoErrorClass({
        type: 'format',
        message: `File type ${file.type} is not supported. Allowed types: ${allowedTypes.join(', ')}`
      });
    }
  }

  private async generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // Capture frame at 1 second
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailUrl);
      };

      video.src = URL.createObjectURL(file);
    });
  }

  private async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  }

  private getVideoFormat(file: File): 'mp4' | 'webm' {
    return file.type === 'video/webm' ? 'webm' : 'mp4';
  }

  // Development helper - add sample videos (COPYRIGHT SAFE)
  async addSampleVideos(): Promise<void> {
    const sampleVideos: Omit<PromotionalVideo, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        title: "💰 Creator Promo - @SexyMia",
        description: "Premium creator advertisement - Paid 0.25 ETH/week",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnailUrl: "https://picsum.photos/1920/1080?random=1&blur=2",
        fileSize: 15728640, // ~15MB
        duration: 60,
        format: 'mp4',
        isActive: true,
        priority: 10,
        analytics: {
          impressions: 1250,
          completionRate: 0.85,
          clickThroughRate: 0.12,
          averageViewTime: 45,
          deviceBreakdown: { desktop: 750, mobile: 400, tablet: 100 },
          performanceScore: 92
        }
      },
      {
        title: "🚀 Web3 Wallet - MetaMask Partnership",
        description: "Sponsored content - Paid 0.4 ETH/week",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        thumbnailUrl: "https://picsum.photos/1920/1080?random=2&blur=2",
        fileSize: 20971520, // ~20MB
        duration: 45,
        format: 'mp4',
        isActive: true,
        priority: 8,
        analytics: {
          impressions: 980,
          completionRate: 0.78,
          clickThroughRate: 0.09,
          averageViewTime: 35,
          deviceBreakdown: { desktop: 600, mobile: 280, tablet: 100 },
          performanceScore: 87
        }
      },
      {
        title: "🎬 Creator Spotlight - @LunaLove",
        description: "Featured creator promotion - Paid 0.2 ETH/week",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        thumbnailUrl: "https://picsum.photos/1920/1080?random=3&blur=2",
        fileSize: 18874368, // ~18MB
        duration: 50,
        format: 'mp4',
        isActive: true,
        priority: 7,
        analytics: {
          impressions: 720,
          completionRate: 0.82,
          clickThroughRate: 0.15,
          averageViewTime: 41,
          deviceBreakdown: { desktop: 420, mobile: 250, tablet: 50 },
          performanceScore: 89
        }
      }
    ];

    for (const videoData of sampleVideos) {
      const video: PromotionalVideo = {
        ...videoData,
        id: `sample_${this.nextId++}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.videos.push(video);
    }
  }

  // Development helper - clear all data (for testing)
  clearAllData(): void {
    this.videos = [];
    this.nextId = 1;
  }
}

// Export singleton instance
export const promotionalVideoService = new MockPromotionalVideoService();

// Initialize with sample data immediately
promotionalVideoService.addSampleVideos().then(() => {
  console.log('✅ Promotional videos loaded successfully');
}).catch(error => {
  console.error('❌ Failed to load promotional videos:', error);
});