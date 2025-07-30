import React from 'react';
import { Wallet } from 'lucide-react';
import { useWallet } from '../../lib/WalletProvider';

export const WalletConnectionPrompt: React.FC = () => {
  const { connectWallet } = useWallet();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-blue-50 border border-blue-200 rounded-xl">
      <Wallet className="w-16 h-16 text-blue-500 mb-4" />
      <h3 className="text-xl font-semibold text-blue-800 mb-2">Connect Your Wallet</h3>
      <p className="text-blue-600 text-center mb-6 max-w-md">
        To access your gamification progress, achievements, and rewards, please connect your wallet.
      </p>
      <button
        onClick={connectWallet}
        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        <Wallet className="w-5 h-5" />
        <span>Connect Wallet</span>
      </button>
    </div>
  );
};