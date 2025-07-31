import React, { useState, useEffect } from 'react';
import { getCurrentPremiumVideoUrl, INVESTOR_HOOK } from '../lib/premiumVideoConfig';

// Simple promotional video component without external dependencies
const SimplePromotionalVideo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showHook, setShowHook] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Show investor hook after 2 seconds, hide after 1.5 seconds
    const hookTimer = setTimeout(() => {
      setShowHook(true);
      setTimeout(() => setShowHook(false), 1500);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hookTimer);
    };
  }, []);

  const handleVideoError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  return (
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
          backgroundColor: '#111827',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #007bff',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}
      
      {!isLoading && !hasError && (
        <video
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
          onError={handleVideoError}
          onLoadedData={handleVideoLoad}
          poster="https://picsum.photos/1920/1080?blur=5"
        >
          <source src={getCurrentPremiumVideoUrl()} type="video/mp4" />
        </video>
      )}
      
      {hasError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom right, rgba(0, 123, 255, 0.2), #111827)',
          backgroundImage: 'url(https://picsum.photos/1920/1080?blur=5)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
      )}
      
      {/* Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#111827',
        opacity: 0.7
      }} />
      
      {/* Investor Hook Overlay */}
      {showHook && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          textAlign: 'center',
          animation: 'fadeInOut 1.5s ease-in-out'
        }}>
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '20px 30px',
            borderRadius: '12px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <p style={{
              color: 'white',
              fontSize: '1.2rem',
              fontFamily: 'satoshi',
              fontWeight: 600,
              margin: 0,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              Unlock <span style={{ color: '#007bff', fontWeight: 700 }}>90%</span> earnings. No bans. Own your pleasure—on-chain.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplePromotionalVideo;