import React from 'react';
import { Page, NavigationProps } from '../types';
import Button from './ui/Button';
import MetamaskIcon from './icons/MetamaskIcon';
import WalletConnectIcon from './icons/WalletConnectIcon';
import ArweaveIcon from './icons/ArweaveIcon';

const LandingPage: React.FC<NavigationProps> = ({ onNavigate }) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover filter blur-md scale-110"
          poster="https://picsum.photos/1920/1080?blur=5"
        >
            {/* Using a placeholder video */}
            <source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" type="video/mp4" />
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-background opacity-70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl md:text-7xl font-satoshi font-black text-white leading-tight mb-6">
          Own Your Pleasure.
          <br />
          <span className="text-primary">Earn 90%.</span> Forever.
        </h1>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
          <Button variant="primary" onClick={() => onNavigate(Page.Upload)}>
            Upload in 5 min
          </Button>
          <Button variant="outline" onClick={() => onNavigate(Page.Explore)}>
            Explore Now
          </Button>
        </div>

        {/* Trust Bar */}
        <div className="flex flex-col items-center">
            <p className="text-text-secondary mb-4 font-satoshi">Powered by</p>
            <div className="flex items-center space-x-8">
                <MetamaskIcon className="h-10 w-10 text-text-secondary hover:text-white transition-colors" />
                <WalletConnectIcon className="h-10 w-10 text-text-secondary hover:text-white transition-colors" />
                <ArweaveIcon className="h-10 w-10 text-text-secondary hover:text-white transition-colors" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
