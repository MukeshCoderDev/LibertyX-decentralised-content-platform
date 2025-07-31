import React, { useState } from 'react';
import { Page, NavigationProps } from '../types';
import Button from './ui/Button';
import PromotionalVideoBackground from './PromotionalVideoBackground';
import VideoPreferenceToggle from './VideoPreferenceToggle';
import { analyticsService } from '../lib/analyticsService';

const LandingPage: React.FC<NavigationProps> = ({ onNavigate }) => {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  const handleButtonClick = async (buttonType: string, page: Page) => {
    if (currentVideoId) {
      await analyticsService.trackClick(currentVideoId, buttonType);
    }
    onNavigate(page);
  };

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      overflow: 'hidden'
    }}>
      {/* Background Video */}
      {videoEnabled && (
        <PromotionalVideoBackground 
          onVideoLoad={(video) => {
            console.log('Loaded promotional video:', video.title);
            setCurrentVideoId(video.id);
          }}
          onVideoError={(error) => console.warn('Promotional video error:', error.message)}
        />
      )}
      
      {/* Video Preference Toggle */}
      <VideoPreferenceToggle 
        onToggle={setVideoEnabled}
      />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontFamily: 'satoshi',
          fontWeight: 900,
          color: 'white',
          lineHeight: 1.2,
          marginBottom: '24px'
        }}>
          LibertyX
          <br />
          <span style={{ color: 'white' }}>The Ultimate Web3 Adult Creator Hub</span>
        </h1>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '48px'
        }}>
          <Button variant="primary" onClick={() => handleButtonClick('upload_button', Page.Upload)}>
            Upload in 5 min
          </Button>
          <Button variant="outline" onClick={() => handleButtonClick('explore_button', Page.Explore)}>
            Explore Now
          </Button>
        </div>

        {/* What is LibertyX Section */}
        <div style={{
          maxWidth: '600px',
          width: '100%',
          marginBottom: '64px'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontFamily: 'satoshi',
            fontWeight: 700,
            color: 'white',
            marginBottom: '24px'
          }}>
            What is LibertyX?
          </h2>
          
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            color: 'white',
            fontFamily: 'satoshi'
          }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 600
                }}>
                  Feature
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 600
                }}>
                  Benefit
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: 600
                }}>
                  Decentralised
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  No bans, no de-platforming, no middle-men.
                </td>
              </tr>
              <tr>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: 600
                }}>
                  Creator-First
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <strong>90% revenue</strong> stays in <strong>your</strong> wallet — forever.
                </td>
              </tr>
              <tr>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: 600
                }}>
                  Arweave-Backed
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  Uploads live <strong>permanently</strong> on-chain.
                </td>
              </tr>
              <tr>
                <td style={{
                  padding: '12px 16px',
                  fontWeight: 600
                }}>
                  5-Minute Onboarding
                </td>
                <td style={{
                  padding: '12px 16px'
                }}>
                  Drag → Drop → Mint → Earn.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Top Reasons to Join Section */}
        <div style={{
          maxWidth: '600px',
          width: '100%',
          marginBottom: '64px'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontFamily: 'satoshi',
            fontWeight: 700,
            color: 'white',
            marginBottom: '24px'
          }}>
            Top Reasons to Join
          </h2>
          
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            color: 'white',
            fontFamily: 'satoshi'
          }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 600
                }}>
                  For Creators
                </th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 600
                }}>
                  For Fans
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  Keep <strong>90%</strong> of every sale
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  Collect exclusive NFT scenes
                </td>
              </tr>
              <tr>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  Immutable content storage
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  Zero-KYC, private tipping
                </td>
              </tr>
              <tr>
                <td style={{
                  padding: '12px 16px'
                }}>
                  Real-time earnings dashboard
                </td>
                <td style={{
                  padding: '12px 16px'
                }}>
                  Trade or stake creator NFTs
                </td>
              </tr>
            </tbody>
          </table>
        </div>


      </div>
    </div>
  );
};

export default LandingPage;
