import { PerformanceService, VideoError } from '../types/promotional-video';

class PromotionalVideoPerformanceService implements PerformanceService {
  private preloadedVideos = new Map<string, string>();
  private deviceType: string;
  private connectionSpeed: string;

  constructor() {
    this.deviceType = this.detectDeviceType();
    this.connectionSpeed = this.detectConnectionSpeed();
    
    // Listen for device orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.deviceType = this.detectDeviceType();
      }, 100);
    });
  }

  getOptimizedVideoUrl(videoId: string, deviceType: string): string {
    // In production, this would return different video qualities based on device
    // For now, return the original URL but log the optimization request
    console.log(`Optimizing video ${videoId} for ${deviceType} device`);
    
    // Check if we have a preloaded version
    const preloadedUrl = this.preloadedVideos.get(videoId);
    if (preloadedUrl) {
      return preloadedUrl;
    }
    
    // Return optimized URL based on device type and connection
    return this.getOptimizedUrlForDevice(videoId, deviceType);
  }

  async preloadNextVideo(): Promise<void> {
    try {
      // In production, this would preload the next video in the background
      console.log('Preloading next video for smooth transitions');
      
      // Simulate preloading delay
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn('Failed to preload next video:', error);
    }
  }

  async handleVideoError(error: VideoError): Promise<string> {
    console.warn('Handling video error:', error);
    
    switch (error.type) {
      case 'network':
        // Return lower quality version or fallback
        return this.getNetworkFallbackUrl();
      
      case 'format':
        // Return alternative format
        return this.getFormatFallbackUrl();
      
      case 'timeout':
        // Return cached version or static image
        return this.getTimeoutFallbackUrl();
      
      case 'storage':
        // Return compressed version
        return this.getStorageFallbackUrl();
      
      default:
        return this.getDefaultFallbackUrl();
    }
  }

  // Device detection
  private detectDeviceType(): string {
    const width = window.innerWidth;
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return 'mobile';
    }
    
    if (/tablet|ipad/i.test(userAgent) || (width >= 768 && width < 1024)) {
      return 'tablet';
    }
    
    return 'desktop';
  }

  // Connection speed detection
  private detectConnectionSpeed(): string {
    // Use Network Information API if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const effectiveType = connection.effectiveType;
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return 'slow';
        case '3g':
          return 'medium';
        case '4g':
          return 'fast';
        default:
          return 'medium';
      }
    }
    
    // Fallback: estimate based on device type
    return this.deviceType === 'mobile' ? 'medium' : 'fast';
  }

  // URL optimization methods
  private getOptimizedUrlForDevice(videoId: string, deviceType: string): string {
    // In production, these would return different video qualities/sizes
    const baseUrl = `https://cdn.libertyx.com/videos/${videoId}`;
    
    switch (deviceType) {
      case 'mobile':
        return `${baseUrl}_mobile.mp4`; // Lower resolution, smaller file
      case 'tablet':
        return `${baseUrl}_tablet.mp4`; // Medium resolution
      case 'desktop':
      default:
        return `${baseUrl}_desktop.mp4`; // Full resolution
    }
  }

  // Fallback URL methods
  private getNetworkFallbackUrl(): string {
    return 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';
  }

  private getFormatFallbackUrl(): string {
    return 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }

  private getTimeoutFallbackUrl(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjMTExODI3Ii8+Cjwvc3ZnPgo=';
  }

  private getStorageFallbackUrl(): string {
    return 'https://picsum.photos/1920/1080?blur=5';
  }

  private getDefaultFallbackUrl(): string {
    return 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';
  }

  // Public utility methods
  getDeviceType(): string {
    return this.deviceType;
  }

  getConnectionSpeed(): string {
    return this.connectionSpeed;
  }

  shouldUseVideoBackground(): boolean {
    // Disable video on very slow connections or low-end devices
    if (this.connectionSpeed === 'slow') return false;
    
    // Check for data saver preference
    const connection = (navigator as any).connection;
    if (connection && connection.saveData) return false;
    
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    
    return true;
  }

  getOptimalVideoSettings() {
    return {
      deviceType: this.deviceType,
      connectionSpeed: this.connectionSpeed,
      shouldAutoplay: this.shouldUseVideoBackground(),
      recommendedQuality: this.getRecommendedQuality(),
      preloadStrategy: this.getPreloadStrategy()
    };
  }

  private getRecommendedQuality(): string {
    if (this.connectionSpeed === 'slow') return 'low';
    if (this.connectionSpeed === 'medium') return 'medium';
    return 'high';
  }

  private getPreloadStrategy(): string {
    if (this.connectionSpeed === 'slow') return 'none';
    if (this.deviceType === 'mobile') return 'metadata';
    return 'auto';
  }
}

// Export singleton instance
export const performanceService = new PromotionalVideoPerformanceService();