import React from 'react';
import { TokenPrice } from '../types';

interface CryptoPriceInputProps {
  price: TokenPrice;
  onPriceChange: (price: TokenPrice) => void;
  className?: string;
}

const CryptoPriceInput: React.FC<CryptoPriceInputProps> = ({
  price,
  onPriceChange,
  className = ''
}) => {
  // Supported tokens with their ranges
  const tokenOptions = [
    // Platform & Popular Layer 1s
    { symbol: 'LIB', name: 'Liberty Token', icon: '🗽', max: 1000, step: 10, decimals: 18 },
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠', max: 10, step: 0.1, decimals: 18 },
    { symbol: 'BTC', name: 'Bitcoin', icon: '₿', max: 1, step: 0.001, decimals: 8 },
    { symbol: 'BNB', name: 'BNB Chain', icon: '🟡', max: 50, step: 1, decimals: 18 },
    { symbol: 'SOL', name: 'Solana', icon: '☀️', max: 100, step: 1, decimals: 9 },
    { symbol: 'ADA', name: 'Cardano', icon: '🔵', max: 1000, step: 10, decimals: 6 },
    { symbol: 'AVAX', name: 'Avalanche', icon: '🔺', max: 100, step: 1, decimals: 18 },
    { symbol: 'DOT', name: 'Polkadot', icon: '⚫', max: 100, step: 1, decimals: 10 },
    { symbol: 'ATOM', name: 'Cosmos', icon: '⚛️', max: 100, step: 1, decimals: 6 },
    { symbol: 'NEAR', name: 'NEAR Protocol', icon: '🌐', max: 100, step: 1, decimals: 24 },
    
    // Layer 2s & Scaling
    { symbol: 'MATIC', name: 'Polygon', icon: '🔷', max: 1000, step: 10, decimals: 18 },
    { symbol: 'OP', name: 'Optimism', icon: '🔴', max: 100, step: 1, decimals: 18 },
    { symbol: 'ARB', name: 'Arbitrum', icon: '🔵', max: 100, step: 1, decimals: 18 },
    { symbol: 'LRC', name: 'Loopring', icon: '🔵', max: 1000, step: 10, decimals: 18 },
    { symbol: 'IMX', name: 'Immutable X', icon: '⚡', max: 100, step: 1, decimals: 18 },
    
    // DeFi Tokens
    { symbol: 'UNI', name: 'Uniswap', icon: '🦄', max: 100, step: 1, decimals: 18 },
    { symbol: 'AAVE', name: 'Aave', icon: '👻', max: 100, step: 1, decimals: 18 },
    { symbol: 'COMP', name: 'Compound', icon: '🏛️', max: 100, step: 1, decimals: 18 },
    { symbol: 'MKR', name: 'Maker', icon: '🏭', max: 10, step: 0.1, decimals: 18 },
    { symbol: 'SNX', name: 'Synthetix', icon: '⚡', max: 100, step: 1, decimals: 18 },
    { symbol: 'CRV', name: 'Curve', icon: '🌊', max: 100, step: 1, decimals: 18 },
    { symbol: 'SUSHI', name: 'SushiSwap', icon: '🍣', max: 100, step: 1, decimals: 18 },
    { symbol: 'YFI', name: 'Yearn Finance', icon: '💰', max: 1, step: 0.001, decimals: 18 },
    
    // Meme & Community
    { symbol: 'DOGE', name: 'Dogecoin', icon: '🐕', max: 10000, step: 100, decimals: 8 },
    { symbol: 'SHIB', name: 'Shiba Inu', icon: '🐕', max: 100000000, step: 1000000, decimals: 18 },
    { symbol: 'PEPE', name: 'Pepe', icon: '🐸', max: 1000000000, step: 10000000, decimals: 18 },
    { symbol: 'BONK', name: 'Bonk', icon: '🔥', max: 1000000000, step: 10000000, decimals: 5 },
    
    // Stablecoins
    { symbol: 'USDT', name: 'Tether', icon: '💵', max: 1000, step: 10, decimals: 6 },
    { symbol: 'USDC', name: 'USD Coin', icon: '💵', max: 1000, step: 10, decimals: 6 },
    { symbol: 'DAI', name: 'Dai', icon: '💰', max: 1000, step: 10, decimals: 18 },
    { symbol: 'FRAX', name: 'Frax', icon: '💎', max: 1000, step: 10, decimals: 18 },
    
    // Gaming & NFT
    { symbol: 'AXS', name: 'Axie Infinity', icon: '🎮', max: 100, step: 1, decimals: 18 },
    { symbol: 'SAND', name: 'The Sandbox', icon: '🏖️', max: 1000, step: 10, decimals: 18 },
    { symbol: 'MANA', name: 'Decentraland', icon: '🌍', max: 1000, step: 10, decimals: 18 },
    { symbol: 'ENJ', name: 'Enjin Coin', icon: '💎', max: 1000, step: 10, decimals: 18 },
    { symbol: 'GALA', name: 'Gala', icon: '🎮', max: 1000, step: 10, decimals: 8 },
    
    // AI & Tech
    { symbol: 'FET', name: 'Fetch.ai', icon: '🤖', max: 1000, step: 10, decimals: 18 },
    { symbol: 'AGIX', name: 'SingularityNET', icon: '🧠', max: 1000, step: 10, decimals: 8 },
    { symbol: 'OCEAN', name: 'Ocean Protocol', icon: '🌊', max: 1000, step: 10, decimals: 18 },
    { symbol: 'RNDR', name: 'Render Token', icon: '🎨', max: 100, step: 1, decimals: 18 },
    { symbol: 'GRT', name: 'The Graph', icon: '📊', max: 1000, step: 10, decimals: 18 },
    { symbol: 'LINK', name: 'Chainlink', icon: '🔗', max: 100, step: 1, decimals: 18 },
    
    // Privacy
    { symbol: 'XMR', name: 'Monero', icon: '🔒', max: 10, step: 0.1, decimals: 12 },
    { symbol: 'ZEC', name: 'Zcash', icon: '🛡️', max: 100, step: 1, decimals: 8 },
    
    // Enterprise & Utility
    { symbol: 'VET', name: 'VeChain', icon: '✅', max: 10000, step: 100, decimals: 18 },
    { symbol: 'XRP', name: 'Ripple', icon: '💧', max: 1000, step: 10, decimals: 6 },
    { symbol: 'XLM', name: 'Stellar', icon: '⭐', max: 1000, step: 10, decimals: 7 },
    { symbol: 'BAT', name: 'Basic Attention', icon: '🦇', max: 1000, step: 10, decimals: 18 }
  ];

  const currentToken = tokenOptions.find(t => t.symbol === price.symbol) || tokenOptions[0];

  // Convert from wei to token units for display
  const displayAmount = parseFloat(price.amount) / Math.pow(10, price.decimals);

  // Format price display based on token
  const formatPrice = (amount: number, symbol: string): string => {
    // High precision tokens
    if (['BTC', 'ETH', 'YFI', 'MKR', 'XMR'].includes(symbol)) {
      return amount.toFixed(4);
    }
    // Medium precision tokens
    else if (['BNB', 'SOL', 'ADA', 'AVAX', 'DOT', 'ATOM', 'NEAR', 'OP', 'ARB', 'UNI', 'AAVE', 'COMP', 'LINK', 'ZEC'].includes(symbol)) {
      return amount.toFixed(2);
    }
    // Meme coins and high supply tokens
    else if (['SHIB', 'PEPE', 'BONK'].includes(symbol)) {
      return (amount / 1000000).toFixed(2) + 'M';
    }
    else if (['DOGE', 'VET'].includes(symbol)) {
      return Math.round(amount).toString();
    }
    // Stablecoins
    else if (['USDT', 'USDC', 'DAI', 'FRAX'].includes(symbol)) {
      return amount.toFixed(2);
    }
    // Standard tokens
    else {
      return Math.round(amount).toString();
    }
  };

  // Handle token change
  const handleTokenChange = (newSymbol: string) => {
    const newToken = tokenOptions.find(t => t.symbol === newSymbol);
    if (!newToken) return;

    // Convert current display amount to new token's wei
    const newAmount = (displayAmount * Math.pow(10, newToken.decimals)).toFixed(0);

    onPriceChange({
      amount: newAmount,
      token: newSymbol,
      decimals: newToken.decimals,
      symbol: newSymbol
    });
  };

  // Handle amount change
  const handleAmountChange = (newDisplayAmount: number) => {
    const newAmount = (newDisplayAmount * Math.pow(10, price.decimals)).toFixed(0);
    
    onPriceChange({
      ...price,
      amount: newAmount
    });
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
    <div className={`space-y-4 ${className}`}>
      {/* Token Selector */}
      <div className="flex items-center gap-4">
        <label className="font-satoshi text-sm text-text-secondary whitespace-nowrap">
          Price Token
        </label>
        <div className="flex items-center gap-3">
          {/* Current Token Display */}
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
            <span className="text-xl">{currentToken.icon}</span>
            <span className={`font-bold text-lg ${getTokenColor(price.symbol)}`}>
              {price.symbol}
            </span>
          </div>
          
          {/* Token Selector Dropdown */}
          <select
            value={price.symbol}
            onChange={(e) => handleTokenChange(e.target.value)}
            className="bg-gray-800 border-2 border-gray-600 rounded-lg px-4 py-3 font-satoshi focus:outline-none focus:border-primary text-white font-bold text-lg min-w-[200px] appearance-none cursor-pointer hover:bg-gray-700 transition-colors shadow-lg"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.25em 1.25em',
              paddingRight: '3rem',
              color: '#ffffff',
              backgroundColor: '#1f2937'
            }}
          >
            {tokenOptions.map(token => (
              <option 
                key={token.symbol} 
                value={token.symbol}
                className="bg-card text-white py-2 px-3 hover:bg-primary/20"
                style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}
              >
                {token.icon} {token.symbol} - {token.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Price Slider */}
      <div className="space-y-2">
        <label className="font-satoshi text-sm text-text-secondary">
          Content Price
        </label>
        <div className="flex items-center gap-4">
          <input 
            type="range" 
            min="0" 
            max={currentToken.max} 
            step={currentToken.step}
            value={displayAmount} 
            onChange={(e) => handleAmountChange(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className={`font-bold text-xl w-24 text-center ${getTokenColor(price.symbol)}`}>
            {formatPrice(displayAmount, price.symbol)} {price.symbol}
          </span>
        </div>
      </div>

      {/* Price Preview */}
      <div className="bg-background/50 p-3 rounded-lg">
        <p className="text-sm text-text-secondary mb-1">Price Preview:</p>
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentToken.icon}</span>
          <span className="font-mono text-lg font-bold">
            {formatPrice(displayAmount, price.symbol)}
          </span>
          <span className={`font-satoshi font-bold ${getTokenColor(price.symbol)}`}>
            {price.symbol}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CryptoPriceInput;