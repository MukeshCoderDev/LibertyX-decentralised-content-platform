import React from 'react';
import ErrorBoundary from './ErrorBoundary';

interface VideoErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

const VideoErrorBoundary: React.FC<VideoErrorBoundaryProps> = ({ children, onError }) => {
  const handleError = (error: Error) => {
    console.error('Video component error:', error);
    onError?.(error);
  };

  const fallback = (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--background, #111827)',
      zIndex: 0
    }}>
      <div style={{
        textAlign: 'center',
        color: 'var(--text-secondary, #888)',
        padding: '24px'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📹</div>
        <h3 style={{ marginBottom: '8px', color: 'var(--text-primary, #fff)' }}>
          Video Error
        </h3>
        <p style={{ fontSize: '14px' }}>
          Unable to load promotional video. Using fallback background.
        </p>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

export default VideoErrorBoundary;