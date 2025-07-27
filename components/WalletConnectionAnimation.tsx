import React, { useState, useEffect } from 'react';

interface WalletConnectionAnimationProps {
  isConnected: boolean;
  walletAddress?: string;
  balance?: string;
  onRefresh?: () => void;
  onDisconnect?: () => void;
}

const WalletConnectionAnimation: React.FC<WalletConnectionAnimationProps> = ({
  isConnected,
  walletAddress,
  balance,
  onRefresh,
  onDisconnect
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [animateBalance, setAnimateBalance] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setTimeout(() => setShowDetails(true), 300);
    } else {
      setShowDetails(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if (balance) {
      setAnimateBalance(true);
      setTimeout(() => setAnimateBalance(false), 600);
    }
  }, [balance]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatBalance = (bal: string) => {
    return parseFloat(bal).toFixed(4);
  };

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-xl p-6 text-center">
        <div className="animate-bounce mb-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-2xl text-white">🔑</span>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Connect Your Arweave Wallet</h3>
        <p className="text-gray-600 text-sm">
          Upload your wallet file to start storing content permanently
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 transform transition-all duration-500 hover:scale-105">
      {/* Success Animation */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-xl text-white">✅</span>
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-green-800 flex items-center">
            Wallet Connected
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              ACTIVE
            </span>
          </h3>
          <p className="text-green-600 text-sm">Ready to upload content permanently</p>
        </div>
      </div>

      {/* Wallet Details with Animation */}
      {showDetails && (
        <div className="space-y-3 animate-fadeIn">
          {/* Address */}
          <div className="bg-white bg-opacity-60 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Wallet Address</p>
                <p className="font-mono text-sm text-gray-800">{formatAddress(walletAddress!)}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(walletAddress!)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Copy address"
              >
                📋
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-white bg-opacity-60 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">AR Balance</p>
                <p className={`font-bold text-lg text-gray-800 ${animateBalance ? 'animate-pulse' : ''}`}>
                  {formatBalance(balance!)} AR
                </p>
              </div>
              <button
                onClick={onRefresh}
                className="text-gray-500 hover:text-gray-700 transition-colors transform hover:rotate-180 duration-300"
                title="Refresh balance"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={onRefresh}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Refresh Balance
            </button>
            <button
              onClick={onDisconnect}
              className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Change Wallet
            </button>
          </div>
        </div>
      )}

      {/* Floating Particles Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default WalletConnectionAnimation;