import React from 'react';

export interface TokenPrice {
  amount: string; // Using string to handle large numbers and decimals
  token: string;
  decimals: number;
  symbol: string;
  icon?: string;
}

interface PriceDisplayProps {
  price: TokenPrice;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  price, 
  size = 'medium', 
  showIcon = true, 
  animate = false,
  className = ''
}) => {
  // Format the price amount based on token decimals
  const formatPrice = (amount: string, decimals: number): string => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '0';
    
    // Convert from wei to token units
    const tokenAmount = numAmount / Math.pow(10, decimals);
    
    // Format based on amount size
    if (tokenAmount >= 1000) {
      return (tokenAmount / 1000).toFixed(1) + 'K';
    } else if (tokenAmount >= 1) {
      return tokenAmount.toFixed(2);
    } else {
      return tokenAmount.toFixed(4);
    }
  };

  // Get token icon based on symbol
  const getTokenIcon = (symbol: string): string => {
    const icons: { [key: string]: string } = {
      // Platform & Layer 1s
      'LIB': '🗽', // Liberty token
      'ETH': '⟠',
      'BTC': '₿',
      'BNB': '🟡',
      'ADA': '🔵',
      'SOL': '☀️',
      'DOT': '⚫',
      'AVAX': '🔺',
      'ATOM': '⚛️',
      'NEAR': '🌐',
      'FTM': '👻',
      'ALGO': '🔷',
      'EGLD': '⚡',
      'FLOW': '🌊',
      'ICP': '♾️',
      'TEZOS': '🔷',
      'HBAR': '🌐',
      
      // Layer 2s & Scaling
      'MATIC': '🔷',
      'OP': '🔴',
      'ARB': '🔵',
      'LRC': '🔵',
      'IMX': '⚡',
      'METIS': '🌟',
      'BOBA': '🧋',
      
      // DeFi Tokens
      'UNI': '🦄',
      'AAVE': '👻',
      'COMP': '🏛️',
      'MKR': '🏭',
      'SNX': '⚡',
      'CRV': '🌊',
      'YFI': '💰',
      'SUSHI': '🍣',
      'BAL': '⚖️',
      '1INCH': '🔄',
      'DYDX': '📈',
      
      // Meme & Community
      'DOGE': '🐕',
      'SHIB': '🐕',
      'PEPE': '🐸',
      'FLOKI': '🐕',
      'BONK': '🔥',
      'WIF': '🧢',
      
      // Stablecoins
      'USDT': '💵',
      'USDC': '💵',
      'DAI': '💰',
      'FRAX': '💎',
      'LUSD': '💵',
      'TUSD': '💵',
      'BUSD': '💵',
      
      // Gaming & NFT
      'AXS': '🎮',
      'SAND': '🏖️',
      'MANA': '🌍',
      'ENJ': '💎',
      'GALA': '🎮',
      'THETA': '📺',
      'CHZ': '⚽',
      
      // AI & Tech
      'FET': '🤖',
      'AGIX': '🧠',
      'OCEAN': '🌊',
      'RNDR': '🎨',
      'GRT': '📊',
      'LINK': '🔗',
      'BAND': '📡',
      'API3': '🔌',
      
      // Privacy
      'XMR': '🔒',
      'ZEC': '🛡️',
      'SCRT': '🤫',
      'ROSE': '🌹',
      
      // Enterprise & Utility
      'VET': '✅',
      'XRP': '💧',
      'XLM': '⭐',
      'IOTA': '🔗',
      'HOLO': '🌐',
      'BAT': '🦇',
      'ZIL': '⚡'
    };
    return icons[symbol] || '💰';
  };

  // Size classes
  const sizeClasses = {
    small: 'text-sm px-2 py-1',
    medium: 'text-base px-3 py-1.5',
    large: 'text-lg px-4 py-2'
  };

  // Token color classes
  const getTokenColor = (symbol: string): string => {
    const colors: { [key: string]: string } = {
      // Platform & Layer 1s
      'LIB': 'text-primary bg-primary/10 border-primary/20',
      'ETH': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      'BTC': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      'BNB': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      'ADA': 'text-blue-600 bg-blue-600/10 border-blue-600/20',
      'SOL': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      'DOT': 'text-pink-500 bg-pink-500/10 border-pink-500/20',
      'AVAX': 'text-red-400 bg-red-400/10 border-red-400/20',
      'ATOM': 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      'NEAR': 'text-green-400 bg-green-400/10 border-green-400/20',
      'FTM': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'ALGO': 'text-gray-600 bg-gray-600/10 border-gray-600/20',
      'EGLD': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
      'FLOW': 'text-green-500 bg-green-500/10 border-green-500/20',
      'ICP': 'text-purple-600 bg-purple-600/10 border-purple-600/20',
      'TEZOS': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      'HBAR': 'text-gray-500 bg-gray-500/10 border-gray-500/20',
      
      // Layer 2s & Scaling
      'MATIC': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      'OP': 'text-red-500 bg-red-500/10 border-red-500/20',
      'ARB': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'LRC': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      'IMX': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
      'METIS': 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      'BOBA': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      
      // DeFi Tokens
      'UNI': 'text-pink-500 bg-pink-500/10 border-pink-500/20',
      'AAVE': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      'COMP': 'text-green-500 bg-green-500/10 border-green-500/20',
      'MKR': 'text-teal-500 bg-teal-500/10 border-teal-500/20',
      'SNX': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'CRV': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
      'YFI': 'text-blue-600 bg-blue-600/10 border-blue-600/20',
      'SUSHI': 'text-pink-400 bg-pink-400/10 border-pink-400/20',
      'BAL': 'text-gray-600 bg-gray-600/10 border-gray-600/20',
      '1INCH': 'text-red-500 bg-red-500/10 border-red-500/20',
      'DYDX': 'text-purple-600 bg-purple-600/10 border-purple-600/20',
      
      // Meme & Community
      'DOGE': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
      'SHIB': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      'PEPE': 'text-green-500 bg-green-500/10 border-green-500/20',
      'FLOKI': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
      'BONK': 'text-red-400 bg-red-400/10 border-red-400/20',
      'WIF': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      
      // Stablecoins
      'USDT': 'text-green-600 bg-green-600/10 border-green-600/20',
      'USDC': 'text-blue-600 bg-blue-600/10 border-blue-600/20',
      'DAI': 'text-yellow-600 bg-yellow-600/10 border-yellow-600/20',
      'FRAX': 'text-gray-600 bg-gray-600/10 border-gray-600/20',
      'LUSD': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'TUSD': 'text-blue-600 bg-blue-600/10 border-blue-600/20',
      'BUSD': 'text-yellow-600 bg-yellow-600/10 border-yellow-600/20',
      
      // Gaming & NFT
      'AXS': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'SAND': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
      'MANA': 'text-red-500 bg-red-500/10 border-red-500/20',
      'ENJ': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      'GALA': 'text-gray-600 bg-gray-600/10 border-gray-600/20',
      'THETA': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      'CHZ': 'text-red-600 bg-red-600/10 border-red-600/20',
      
      // AI & Tech
      'FET': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'AGIX': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      'OCEAN': 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      'RNDR': 'text-red-500 bg-red-500/10 border-red-500/20',
      'GRT': 'text-purple-600 bg-purple-600/10 border-purple-600/20',
      'LINK': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'BAND': 'text-blue-600 bg-blue-600/10 border-blue-600/20',
      'API3': 'text-gray-600 bg-gray-600/10 border-gray-600/20',
      
      // Privacy
      'XMR': 'text-orange-600 bg-orange-600/10 border-orange-600/20',
      'ZEC': 'text-yellow-600 bg-yellow-600/10 border-yellow-600/20',
      'SCRT': 'text-gray-600 bg-gray-600/10 border-gray-600/20',
      'ROSE': 'text-pink-500 bg-pink-500/10 border-pink-500/20',
      
      // Enterprise & Utility
      'VET': 'text-blue-600 bg-blue-600/10 border-blue-600/20',
      'XRP': 'text-gray-600 bg-gray-600/10 border-gray-600/20',
      'XLM': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      'IOTA': 'text-gray-500 bg-gray-500/10 border-gray-500/20',
      'HOLO': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      'BAT': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      'ZIL': 'text-teal-500 bg-teal-500/10 border-teal-500/20'
    };
    return colors[symbol] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  };

  const formattedAmount = formatPrice(price.amount, price.decimals);
  const tokenColor = getTokenColor(price.symbol);
  const sizeClass = sizeClasses[size];

  return (
    <div 
      className={`
        inline-flex items-center gap-1.5 font-bold rounded-full border
        ${tokenColor} ${sizeClass} ${animate ? 'transition-all duration-300 hover:scale-105' : ''}
        ${className}
      `}
    >
      {showIcon && (
        <span className="text-current">
          {price.icon || getTokenIcon(price.symbol)}
        </span>
      )}
      <span className="font-mono">
        {formattedAmount}
      </span>
      <span className="font-satoshi font-bold">
        {price.symbol}
      </span>
    </div>
  );
};

export default PriceDisplay;