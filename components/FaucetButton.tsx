import React from 'react';
import { openFaucet } from '../src/config';

interface FaucetButtonProps {
  network?: string;
  className?: string;
}

export const FaucetButton: React.FC<FaucetButtonProps> = ({ 
  network = 'sepolia', 
  className = '' 
}) => {
  const handleFaucetClick = () => {
    openFaucet(network);
  };

  return (
    <button
      onClick={handleFaucetClick}
      className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors ${className}`}
      title="Get test ETH for Sepolia testnet"
    >
      🚰 Get Test ETH
    </button>
  );
};

export default FaucetButton;