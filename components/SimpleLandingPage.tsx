import React from 'react';
import { Page, NavigationProps } from '../types';
import Button from './ui/Button';
import MetamaskIcon from './icons/MetamaskIcon';
import WalletConnectIcon from './icons/WalletConnectIcon';
import ArweaveIcon from './icons/ArweaveIcon';
import SimplePromotionalVideo from './SimplePromotionalVideo';

const SimpleLandingPage: React.FC<NavigationProps> = ({ onNavigate }) => {
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
      <SimplePromotionalVideo />

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
          Own Your Pleasure.
          <br />
          <span style={{ color: '#007bff' }}>Earn 90%.</span> Forever.
        </h1>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '64px'
        }}>
          <Button variant="primary" onClick={() => onNavigate(Page.Upload)}>
            Upload in 5 min
          </Button>
          <Button variant="outline" onClick={() => onNavigate(Page.Explore)}>
            Explore Now
          </Button>
        </div>

        {/* Trust Bar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
            <p style={{
              color: '#888',
              marginBottom: '16px',
              fontFamily: 'satoshi'
            }}>Powered by</p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '32px'
            }}>
                <MetamaskIcon style={{
                  height: '40px',
                  width: '40px',
                  color: '#888',
                  transition: 'color 0.3s'
                }} />
                <WalletConnectIcon style={{
                  height: '40px',
                  width: '40px',
                  color: '#888',
                  transition: 'color 0.3s'
                }} />
                <ArweaveIcon style={{
                  height: '40px',
                  width: '40px',
                  color: '#888',
                  transition: 'color 0.3s'
                }} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleLandingPage;