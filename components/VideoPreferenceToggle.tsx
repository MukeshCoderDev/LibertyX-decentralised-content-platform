import React, { useState, useEffect } from 'react';

interface VideoPreferenceToggleProps {
  onToggle?: (enabled: boolean) => void;
  className?: string;
}

const VideoPreferenceToggle: React.FC<VideoPreferenceToggleProps> = ({
  onToggle,
  className = ''
}) => {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    // Load saved preference
    const savedPreference = localStorage.getItem('video-background-enabled');
    const enabled = savedPreference !== 'false';
    setVideoEnabled(enabled);

    // Only show toggle on mobile devices or slow connections
    const isMobile = window.innerWidth < 768;
    const connection = (navigator as any).connection;
    const isSlowConnection = connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g');
    
    setShowToggle(isMobile || isSlowConnection || connection?.saveData);
  }, []);

  const handleToggle = () => {
    const newValue = !videoEnabled;
    setVideoEnabled(newValue);
    localStorage.setItem('video-background-enabled', newValue.toString());
    onToggle?.(newValue);
  };

  if (!showToggle) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 50
    }} className={className}>
      <button
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border, #374151)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '14px',
          color: 'var(--text-secondary, #888)',
          cursor: 'pointer',
          transition: 'color 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary, #fff)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary, #888)'}
        aria-label={videoEnabled ? 'Disable video background' : 'Enable video background'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: videoEnabled ? '#10b981' : '#ef4444'
          }} />
          <span>{videoEnabled ? 'Video On' : 'Video Off'}</span>
        </div>
      </button>
    </div>
  );
};

export default VideoPreferenceToggle;