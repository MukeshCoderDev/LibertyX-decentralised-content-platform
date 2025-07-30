import React from 'react';
import { TokenPrice } from '../types';

interface CryptoPriceRangeSelectorProps {
  selectedToken: string;
  maxPrice: number;
  onTokenChange: (token: string) => void;
  onPriceChange: (price: number) => void;
  className?: string;
}

const CryptoPriceRangeSelector: React.FC<CryptoPriceRangeSelectorProps> = ({
  selectedToken,
  maxPrice,
  onTokenChange,
  onPriceChange,
  className = ''
}) => {
  // Supported tokens with their ranges
  const tokenOptions = [
    // Platform & Popular Layer 1s
    { symbol: 'LIB', name: 'Liberty Token', icon: '🗽', max: 1000, step: 10 },
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠', max: 10, step: 0.1 },
    { symbol: 'BTC', name: 'Bitcoin', icon: '₿', max: 1, step: 0.001 },
    { symbol: 'BNB', name: 'BNB Chain', icon: '🟡', max: 50, step: 1 },
    { symbol: 'SOL', name: 'Solana', icon: '☀️', max: 100, step: 1 },
    { symbol: 'ADA', name: 'Cardano', icon: '🔵', max: 1000, step: 10 },
    { symbol: 'AVAX', name: 'Avalanche', icon: '🔺', max: 100, step: 1 },
    { symbol: 'DOT', name: 'Polkadot', icon: '⚫', max: 100, step: 1 },
    { symbol: 'ATOM', name: 'Cosmos', icon: '⚛️', max: 100, step: 1 },
    { symbol: 'NEAR', name: 'NEAR Protocol', icon: '🌐', max: 100, step: 1 },
    
    // Layer 2s & Scaling
    { symbol: 'MATIC', name: 'Polygon', icon: '🔷', max: 1000, step: 10 },
    { symbol: 'OP', name: 'Optimism', icon: '🔴', max: 100, step: 1 },
    { symbol: 'ARB', name: 'Arbitrum', icon: '🔵', max: 100, step: 1 },
    { symbol: 'LRC', name: 'Loopring', icon: '🔵', max: 1000, step: 10 },
    { symbol: 'IMX', name: 'Immutable X', icon: '⚡', max: 100, step: 1 },
    
    // DeFi Tokens
    { symbol: 'UNI', name: 'Uniswap', icon: '🦄', max: 100, step: 1 },
    { symbol: 'AAVE', name: 'Aave', icon: '👻', max: 100, step: 1 },
    { symbol: 'COMP', name: 'Compound', icon: '🏛️', max: 100, step: 1 },
    { symbol: 'MKR', name: 'Maker', icon: '🏭', max: 10, step: 0.1 },
    { symbol: 'SNX', name: 'Synthetix', icon: '⚡', max: 100, step: 1 },
    { symbol: 'CRV', name: 'Curve', icon: '🌊', max: 100, step: 1 },
    { symbol: 'SUSHI', name: 'SushiSwap', icon: '🍣', max: 100, step: 1 },
    { symbol: 'YFI', name: 'Yearn Finance', icon: '💰', max: 1, step: 0.001 },
    
    // Meme & Community
    { symbol: 'DOGE', name: 'Dogecoin', icon: '🐕', max: 10000, step: 100 },
    { symbol: 'SHIB', name: 'Shiba Inu', icon: '🐕', max: 100000000, step: 1000000 },
    { symbol: 'PEPE', name: 'Pepe', icon: '🐸', max: 1000000000, step: 10000000 },
    { symbol: 'BONK', name: 'Bonk', icon: '🔥', max: 1000000000, step: 10000000 },
    
    // Stablecoins
    { symbol: 'USDT', name: 'Tether', icon: '💵', max: 1000, step: 10 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', max: 1000, step: 10 },
    { symbol: 'DAI', name: 'Dai', icon: '💰', max: 1000, step: 10 },
    { symbol: 'FRAX', name: 'Frax', icon: '💎', max: 1000, step: 10 },
    
    // Gaming & NFT
    { symbol: 'AXS', name: 'Axie Infinity', icon: '🎮', max: 100, step: 1 },
    { symbol: 'SAND', name: 'The Sandbox', icon: '🏖️', max: 1000, step: 10 },
    { symbol: 'MANA', name: 'Decentraland', icon: '🌍', max: 1000, step: 10 },
    { symbol: 'ENJ', name: 'Enjin Coin', icon: '💎', max: 1000, step: 10 },
    { symbol: 'GALA', name: 'Gala', icon: '🎮', max: 1000, step: 10 },
    
    // AI & Tech
    { symbol: 'FET', name: 'Fetch.ai', icon: '🤖', max: 1000, step: 10 },
    { symbol: 'AGIX', name: 'SingularityNET', icon: '🧠', max: 1000, step: 10 },
    { symbol: 'OCEAN', name: 'Ocean Protocol', icon: '🌊', max: 1000, step: 10 },
    { symbol: 'RNDR', name: 'Render Token', icon: '🎨', max: 100, step: 1 },
    { symbol: 'GRT', name: 'The Graph', icon: '📊', max: 1000, step: 10 },
    { symbol: 'LINK', name: 'Chainlink', icon: '🔗', max: 100, step: 1 },
    
    // Privacy
    { symbol: 'XMR', name: 'Monero', icon: '🔒', max: 10, step: 0.1 },
    { symbol: 'ZEC', name: 'Zcash', icon: '🛡️', max: 100, step: 1 },
    
    // Enterprise & Utility
    { symbol: 'VET', name: 'VeChain', icon: '✅', max: 10000, step: 100 },
    { symbol: 'XRP', name: 'Ripple', icon: '💧', max: 1000, step: 10 },
    { symbol: 'XLM', name: 'Stellar', icon: '⭐', max: 1000, step: 10 },
    { symbol: 'BAT', name: 'Basic Attention', icon: '🦇', max: 1000, step: 10 }
  ];

  const currentToken = tokenOptions.find(t => t.symbol === selectedToken) || tokenOptions[0];

  // Format price display based on token
  const formatPrice = (price: number, token: string): string => {
    const tokenInfo = tokenOptions.find(t => t.symbol === token);
    if (!tokenInfo) return price.toString();

    // High precision tokens
    if (['BTC', 'ETH', 'YFI', 'MKR', 'XMR'].includes(token)) {
      return price.toFixed(3);
    }
    // Medium precision tokens
    else if (['BNB', 'SOL', 'ADA', 'AVAX', 'DOT', 'ATOM', 'NEAR', 'OP', 'ARB', 'UNI', 'AAVE', 'COMP', 'LINK'].includes(token)) {
      return price.toFixed(1);
    }
    // Meme coins and high supply tokens
    else if (['SHIB', 'PEPE', 'BONK'].includes(token)) {
      return (price / 1000000).toFixed(1) + 'M';
    }
    else if (['DOGE', 'VET'].includes(token)) {
      return Math.round(price).toString();
    }
    // Standard tokens
    else {
      return Math.round(price).toString();
    }
  };

  // Get token color
  const getTokenColor = (symbol: string): string => {
    const colors: { [key: string]: string } = {
      // Platform & Layer 1s
      'LIB': 'text-primary',
      'ETH': 'text-blue-400',
      'BTC': 'text-orange-500',
      'BNB': 'text-yellow-400',
      'SOL': 'text-purple-500',
      'ADA': 'text-blue-600',
      'AVAX': 'text-red-400',
      'DOT': 'text-pink-500',
      'ATOM': 'text-indigo-500',
      'NEAR': 'text-green-400',
      
      // Layer 2s
      'MATIC': 'text-purple-400',
      'OP': 'text-red-500',
      'ARB': 'text-blue-500',
      'LRC': 'text-blue-400',
      'IMX': 'text-cyan-400',
      
      // DeFi
      'UNI': 'text-pink-500',
      'AAVE': 'text-purple-500',
      'COMP': 'text-green-500',
      'MKR': 'text-teal-500',
      'SNX': 'text-blue-500',
      'CRV': 'text-yellow-500',
      'SUSHI': 'text-pink-400',
      'YFI': 'text-blue-600',
      
      // Meme
      'DOGE': 'text-yellow-500',
      'SHIB': 'text-orange-500',
      'PEPE': 'text-green-500',
      'BONK': 'text-red-400',
      
      // Stablecoins
      'USDT': 'text-green-600',
      'USDC': 'text-blue-600',
      'DAI': 'text-yellow-600',
      'FRAX': 'text-gray-600',
      
      // Gaming
      'AXS': 'text-blue-500',
      'SAND': 'text-yellow-500',
      'MANA': 'text-red-500',
      'ENJ': 'text-purple-500',
      'GALA': 'text-gray-600',
      
      // AI & Tech
      'FET': 'text-blue-500',
      'AGIX': 'text-purple-500',
      'OCEAN': 'text-cyan-500',
      'RNDR': 'text-red-500',
      'GRT': 'text-purple-600',
      'LINK': 'text-blue-500',
      
      // Privacy
      'XMR': 'text-orange-600',
      'ZEC': 'text-yellow-600',
      
      // Enterprise
      'VET': 'text-blue-600',
      'XRP': 'text-gray-600',
      'XLM': 'text-blue-400',
      'BAT': 'text-orange-500'
    };
    return colors[symbol] || 'text-gray-400';
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Token Selector */}
      <div className="flex items-center gap-2">
        <label className="font-satoshi text-sm text-white/90 whitespace-nowrap">
          Price Token
        </label>
        <select
          value={selectedToken}
          onChange={(e) => onTokenChange(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-1 text-sm font-satoshi text-white/90 focus:outline-none focus:border-primary focus:text-white"
        >
          {tokenOptions.map(token => (
            <option key={token.symbol} value={token.symbol}>
              {token.icon} {token.symbol}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Slider */}
      <div className="flex items-center gap-4">
        <label className="font-satoshi text-sm text-white/90 whitespace-nowrap">
          Max Price
        </label>
        <input
          type="range"
          min="0"
          max={currentToken.max}
          step={currentToken.step}
          value={maxPrice}
          onChange={(e) => onPriceChange(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className={`font-satoshi font-bold w-20 text-right ${getTokenColor(selectedToken)}`}>
          {formatPrice(maxPrice, selectedToken)} {selectedToken}
        </span>
      </div>
    </div>
  );
};

export default CryptoPriceRangeSelector;