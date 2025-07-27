import React, { useRef, useState, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface WalletUploadProps {
  onWalletLoaded?: () => void;
  showInstructions?: boolean;
}

const WalletUpload: React.FC<WalletUploadProps> = ({ 
  onWalletLoaded, 
  showInstructions = true 
}) => {
  const {
    wallet,
    isLoading,
    error,
    isWalletLoaded,
    walletAddress,
    walletBalance,
    loadWallet,
    refreshBalance,
    clearWallet,
    clearError
  } = useWallet();

  const [dragActive, setDragActive] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.endsWith('.json')) {
      alert('Please select a JSON wallet file');
      return;
    }

    try {
      await loadWallet(file);
      if (onWalletLoaded) {
        onWalletLoaded();
      }
    } catch (error) {
      // Error is handled by the hook
    }
  }, [loadWallet, onWalletLoaded]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (isWalletLoaded) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <div className="text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-medium text-green-800">Wallet Connected</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Address: {formatAddress(walletAddress!)}
            </p>
            <p className="text-sm text-green-700">
              Balance: {parseFloat(walletBalance!).toFixed(4)} AR
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={refreshBalance}
              disabled={isLoading}
              className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1"
            >
              {isLoading ? '...' : '🔄'}
            </Button>
            <Button
              onClick={clearWallet}
              className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-3 py-1"
            >
              Change
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      {showInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-800">Upload Your Arweave Wallet</h4>
              <p className="text-sm text-blue-700 mt-1">
                You need to provide your own Arweave wallet to pay for video storage. 
                Your wallet file will only be stored in memory during this session.
              </p>
              <button
                onClick={() => setShowInstructionsModal(true)}
                className="text-sm text-blue-600 hover:text-blue-800 underline mt-2"
              >
                How to get an Arweave wallet →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-3">
              <div className="text-red-600 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-red-800">Wallet Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".json"
          disabled={isLoading}
        />
        
        <div className="space-y-2">
          <div className="text-gray-400">
            {isLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            ) : (
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>
          <p className="font-medium text-gray-900">
            {isLoading ? 'Loading wallet...' : 'Drop your wallet file here or click to browse'}
          </p>
          <p className="text-sm text-gray-500">
            Supports Arweave keyfile (.json) format only
          </p>
        </div>
      </div>

      {/* Instructions Modal */}
      <Modal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        title="How to Get an Arweave Wallet"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Option 1: ArConnect Browser Extension</h4>
            <p className="text-sm text-gray-600 mb-2">
              The easiest way to get started with Arweave:
            </p>
            <ol className="text-sm text-gray-600 space-y-1 ml-4">
              <li>1. Install ArConnect browser extension</li>
              <li>2. Create a new wallet</li>
              <li>3. Export your keyfile from ArConnect settings</li>
              <li>4. Fund your wallet with AR tokens</li>
            </ol>
            <a
              href="https://arconnect.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Get ArConnect →
            </a>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Option 2: Arweave Web Wallet</h4>
            <p className="text-sm text-gray-600 mb-2">
              Create a wallet directly on the Arweave website:
            </p>
            <ol className="text-sm text-gray-600 space-y-1 ml-4">
              <li>1. Visit the Arweave web wallet</li>
              <li>2. Generate a new wallet</li>
              <li>3. Download your keyfile</li>
              <li>4. Fund your wallet</li>
            </ol>
            <a
              href="https://arweave.app/wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Create Wallet →
            </a>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Funding Your Wallet</h4>
            <p className="text-sm text-gray-600 mb-2">
              You can buy AR tokens from these exchanges:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Binance, KuCoin, Gate.io</li>
              <li>• Uniswap (for ETH holders)</li>
              <li>• Direct from other Arweave users</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Security Note:</strong> Your wallet file contains your private keys. 
              Keep it secure and never share it with anyone. LibertyX only uses it 
              temporarily to sign your upload transactions.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WalletUpload;