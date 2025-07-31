import React, { useState, useEffect, useRef } from 'react';
import { PromotionalVideo } from '../types/promotional-video';
import { promotionalVideoService } from '../lib/promotionalVideoService';
import { arweaveService } from '../lib/arweaveService';

interface Web3PromotionalVideoProps {
  className?: string;
  onVideoLoad?: (video: PromotionalVideo) => void;
  onVideoError?: (error: Error) => void;
  enableAnalytics?: boolean;
}

export const Web3PromotionalVideo: React.FC<Web3PromotionalVideoProps> = ({
  className = '',
  onVideoLoad,
  onVideoError,
  enableAnalytics = true
}) => {
  const [currentVideo, setCurrentVideo] = useState<PromotionalVideo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  // Load current promotional video
  useEffect(() => {
    loadCurrentVideo();
  }, []);

  // Track analytics when video starts playing
  useEffect(() => {
    if (currentVideo && hasStartedPlaying && enableAnalytics) {
      trackVideoImpression();
    }
  }, [currentVideo, hasStartedPlaying, enableAnalytics]);

  const loadCurrentVideo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const video = await promotionalVideoService.getCurrentVideo();
      
      if (!video) {
        setError('No promotional videos available');
        return;
      }

      // Check if this is an Arweave URL
      if (video.videoUrl.includes('arweave.net')) {
        console.log('Loading Web3 promotional video from Arweave:', video.id);
        
        // For Arweave content, we can add additional verification
        try {
          const metadata = await arweaveService.getTransactionMetadata(video.id);
          console.log('Arweave video metadata:', metadata);
        } catch (metadataError) {
          console.warn('Could not fetch Arweave metadata:', metadataError);
        }
      }

      setCurrentVideo(video);
      onVideoLoad?.(video);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load promotional video';
      setError(errorMessage);
      onVideoError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const trackVideoImpression = async () => {
    if (!currentVideo) return;
    
    try {
      // Track impression in analytics
      const deviceType = getDeviceType();
      console.log(`📊 Tracking impression for promotional video: ${currentVideo.title} (${deviceType})`);
      
      // Update video analytics (in a real implementation, this would call an analytics service)
      currentVideo.analytics.impressions += 1;
      currentVideo.analytics.deviceBreakdown[deviceType as keyof typeof currentVideo.analytics.deviceBreakdown] += 1;
      
    } catch (error) {
      console.error('Failed to track video impression:', error);
    }
  };

  const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  const handleVideoLoad = () => {
    setLoadingProgress(100);
    console.log('✅ Promotional video loaded successfully');
  };

  const handleVideoPlay = () => {
    setHasStartedPlaying(true);
    console.log('▶️ Promotional video started playing');
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoError = (e.target as HTMLVideoElement).error;
    const errorMessage = videoError 
      ? `Video error: ${videoError.message} (Code: ${videoError.code})`
      : 'Unknown video error';
    
    console.error('❌ Promotional video error:', errorMessage);
    setError(errorMessage);
    onVideoError?.(new Error(errorMessage));
  };

  const handleLoadProgress = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          const progress = (bufferedEnd / duration) * 100;
          setLoadingProgress(Math.min(progress, 100));
        }
      }
    }
  };

  // Fallback content for when no video is available
  const renderFallback = () => (
    <div className={`promotional-video-fallback ${className}`}>
      <div className="fallback-content">
        <div className="libertyX-logo">
          <h1>LibertyX</h1>
          <p>Decentralized Content Platform</p>
        </div>
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button onClick={loadCurrentVideo} className="retry-button">
              Retry Loading
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={`promotional-video-loading ${className}`}>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading promotional content...</p>
          {loadingProgress > 0 && (
            <div className="loading-progress">
              <div 
                className="progress-bar" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state or no video available
  if (error || !currentVideo) {
    return renderFallback();
  }

  return (
    <div className={`web3-promotional-video ${className}`}>
      <video
        ref={videoRef}
        src={currentVideo.videoUrl}
        poster={currentVideo.thumbnailUrl}
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={handleVideoLoad}
        onPlay={handleVideoPlay}
        onError={handleVideoError}
        onProgress={handleLoadProgress}
        className="promotional-video"
      >
        <source src={currentVideo.videoUrl} type={`video/${currentVideo.format}`} />
        Your browser does not support the video tag.
      </video>
      
      {/* Video overlay with Web3 indicators */}
      <div className="video-overlay">
        <div className="web3-indicators">
          {currentVideo.videoUrl.includes('arweave.net') && (
            <div className="arweave-badge">
              <span className="badge-icon">🌐</span>
              <span className="badge-text">Stored on Arweave</span>
            </div>
          )}
          
          <div className="video-info">
            <h3 className="video-title">{currentVideo.title}</h3>
            <p className="video-description">{currentVideo.description}</p>
          </div>
        </div>
        
        {/* Analytics display (development only) */}
        {process.env.NODE_ENV === 'development' && enableAnalytics && (
          <div className="analytics-overlay">
            <div className="analytics-stats">
              <span>👁️ {currentVideo.analytics.impressions}</span>
              <span>📱 {getDeviceType()}</span>
              <span>⏱️ {currentVideo.duration}s</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Web3PromotionalVideo;