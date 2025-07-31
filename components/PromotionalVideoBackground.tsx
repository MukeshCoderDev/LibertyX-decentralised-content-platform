import React, { useState, useEffect, useRef } from 'react';
import { PromotionalVideo, FALLBACK_STRATEGY } from '../types/promotional-video';
import { promotionalVideoService } from '../lib/promotionalVideoService';
import { performanceService } from '../lib/performanceService';
import { analyticsService } from '../lib/analyticsService';
import VideoErrorBoundary from './VideoErrorBoundary';

interface PromotionalVideoBackgroundProps {
  className?: string;
  onVideoLoad?: (video: PromotionalVideo) => void;
  onVideoError?: (error: Error) => void;
}

const PromotionalVideoBackground: React.FC<PromotionalVideoBackgroundProps> = ({
  className = '',
  onVideoLoad,
  onVideoError
}) => {
  const [currentVideo, setCurrentVideo] = useState<PromotionalVideo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [fallbackLevel, setFallbackLevel] = useState<keyof typeof FALLBACK_STRATEGY>('primary');
  const [shouldUseVideo, setShouldUseVideo] = useState(true);
  const [deviceType, setDeviceType] = useState('desktop');
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    // Check performance settings
    const settings = performanceService.getOptimalVideoSettings();
    setShouldUseVideo(settings.shouldAutoplay);
    setDeviceType(settings.deviceType);
    
    if (settings.shouldAutoplay) {
      loadCurrentVideo();
    } else {
      // Use static background for performance
      setFallbackLevel('tertiary');
    }
    
    // Set up rotation interval (adjust based on device)
    const rotationInterval = setInterval(() => {
      if (!hasError && currentVideo && shouldUseVideo) {
        rotateToNextVideo();
      }
    }, deviceType === 'mobile' ? 60000 : 30000); // Longer intervals on mobile
    
    // Cleanup timeout and interval on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearInterval(rotationInterval);
    };
  }, [hasError, currentVideo, shouldUseVideo, deviceType]);

  const loadCurrentVideo = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      console.log('🎬 Loading promotional video...');
      
      // Set timeout for video loading
      timeoutRef.current = setTimeout(() => {
        handleVideoError(new Error('Video loading timeout'));
      }, 5000);

      const video = await promotionalVideoService.getCurrentVideo();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      console.log('🎬 Promotional video result:', video);

      if (video) {
        console.log('✅ Loading video:', video.title, video.videoUrl);
        setCurrentVideo(video);
        onVideoLoad?.(video);
        
        // Track impression
        trackImpression(video.id);
      } else {
        // No active videos, use fallback
        console.warn('❌ No active promotional videos available');
        handleVideoError(new Error('No active promotional videos available'));
      }
    } catch (error) {
      console.error('❌ Error loading promotional video:', error);
      handleVideoError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoError = (error: Error) => {
    console.warn('Promotional video error:', error.message);
    setHasError(true);
    onVideoError?.(error);
    
    // Progress through fallback levels
    const fallbackLevels = Object.keys(FALLBACK_STRATEGY) as Array<keyof typeof FALLBACK_STRATEGY>;
    const currentIndex = fallbackLevels.indexOf(fallbackLevel);
    
    if (currentIndex < fallbackLevels.length - 1) {
      setFallbackLevel(fallbackLevels[currentIndex + 1]);
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleVideoCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
    startTimeRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleVideoLoadError = () => {
    handleVideoError(new Error('Failed to load video file'));
  };

  const rotateToNextVideo = async () => {
    try {
      // Track completion of current video before rotating
      if (currentVideo) {
        await trackVideoCompletion(currentVideo.id);
      }

      const nextVideo = await promotionalVideoService.getNextVideo(currentVideo?.id);
      if (nextVideo && nextVideo.id !== currentVideo?.id) {
        setCurrentVideo(nextVideo);
        onVideoLoad?.(nextVideo);
        trackImpression(nextVideo.id);
      }
    } catch (error) {
      console.warn('Failed to rotate to next video:', error);
    }
  };

  const handleVideoEnded = () => {
    if (currentVideo) {
      trackVideoCompletion(currentVideo.id);
    }
  };

  const handleVideoTimeUpdate = () => {
    // Track interaction when user watches significant portion
    if (videoRef.current && currentVideo) {
      const video = videoRef.current;
      const watchedPercentage = (video.currentTime / video.duration) * 100;
      
      // Track milestone interactions
      if (watchedPercentage >= 25 && !video.dataset.tracked25) {
        trackInteraction(currentVideo.id, 'watched_25_percent');
        video.dataset.tracked25 = 'true';
      }
      if (watchedPercentage >= 50 && !video.dataset.tracked50) {
        trackInteraction(currentVideo.id, 'watched_50_percent');
        video.dataset.tracked50 = 'true';
      }
      if (watchedPercentage >= 75 && !video.dataset.tracked75) {
        trackInteraction(currentVideo.id, 'watched_75_percent');
        video.dataset.tracked75 = 'true';
      }
    }
  };

  const trackImpression = async (videoId: string) => {
    try {
      await analyticsService.trackImpression(videoId, deviceType);
    } catch (error) {
      console.warn('Failed to track impression:', error);
    }
  };

  const trackVideoCompletion = async (videoId: string) => {
    try {
      const watchTime = startTimeRef.current > 0 
        ? (Date.now() - startTimeRef.current) / 1000 
        : 0;
      await analyticsService.trackCompletion(videoId, watchTime);
    } catch (error) {
      console.warn('Failed to track video completion:', error);
    }
  };

  const trackInteraction = async (videoId: string, interactionType: string) => {
    try {
      await analyticsService.trackInteraction(videoId, interactionType);
    } catch (error) {
      console.warn('Failed to track interaction:', error);
    }
  };

  const getOptimizedVideoUrl = (video: PromotionalVideo): string => {
    // For now, return the actual video URL directly
    // In production, this would go through performance optimization
    console.log('🎬 Using video URL:', video.videoUrl);
    return video.videoUrl;
  };

  // Render fallback content based on fallback level
  const renderFallback = () => {
    switch (fallbackLevel) {
      case 'secondary':
        // Try default promotional video
        return (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(4px)',
              transform: 'scale(1.1)'
            }}
            className={className}
            onCanPlay={handleVideoCanPlay}
            onError={handleVideoLoadError}
            onEnded={handleVideoEnded}
            onTimeUpdate={handleVideoTimeUpdate}
            poster="https://picsum.photos/1920/1080?blur=5"
          >
            <source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" type="video/mp4" />
          </video>
        );
      
      case 'tertiary':
        // Static branded background
        return (
          <div 
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to bottom right, rgba(0, 123, 255, 0.2), var(--background, #111827))',
              backgroundImage: 'url(https://picsum.photos/1920/1080?blur=5)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            className={className}
          />
        );
      
      case 'emergency':
        // Solid color background
        return (
          <div 
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to bottom right, rgba(0, 123, 255, 0.1), var(--background, #111827))'
            }}
            className={className}
          />
        );
      
      default:
        // Primary - try current promotional video
        return currentVideo && shouldUseVideo ? (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(4px)',
              transform: 'scale(1.1)'
            }}
            className={className}
            onCanPlay={handleVideoCanPlay}
            onError={handleVideoLoadError}
            onEnded={handleVideoEnded}
            onTimeUpdate={handleVideoTimeUpdate}
            poster={currentVideo.thumbnailUrl}
            preload={performanceService.getOptimalVideoSettings().preloadStrategy}
          >
            <source src={getOptimizedVideoUrl(currentVideo)} type={`video/${currentVideo.format}`} />
          </video>
        ) : null;
    }
  };

  return (
    <VideoErrorBoundary onError={onVideoError}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0
      }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--background, #111827)',
            animation: 'pulse 2s infinite'
          }} />
        )}
        
        {renderFallback()}
        
        {/* Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--background, #111827)',
          opacity: 0.7
        }} />
        
        {/* Loading indicator */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '2px solid var(--primary, #007bff)',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        )}
      </div>
    </VideoErrorBoundary>
  );
};

export default PromotionalVideoBackground;