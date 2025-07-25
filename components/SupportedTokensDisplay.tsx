import React, { useState } from 'react';
import { getAllTokens, getTokensByCategory, TOKEN_CATEGORIES, TokenConfig } from '../lib/tokenConfig';

const SupportedTokensDisplay: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const allTokens = getAllTokens();
  const displayTokens = selectedCategory === 'all' 
    ? allTokens 
    : getTokensByCategory(selectedCategory as any);

  const tokenCount = allTokens.length;

  return (
    <div className="bg-card p-4 sm:p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-satoshi font-bold">Supported Cryptocurrencies</h3>
          <p className="text-text-secondary text-xs sm:text-sm">
            {tokenCount}+ tokens supported across all major blockchain ecosystems
          </p>
        </div>
        
        {/* Category Filter - Mobile Optimized */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-full sm:w-auto min-h-[44px]"
        >
          <option value="all">All Categories ({tokenCount})</option>
          {Object.entries(TOKEN_CATEGORIES).map(([category, label]) => {
            const count = getTokensByCategory(category as any).length;
            return (
              <option key={category} value={category}>
                {label} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {/* Token Grid - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
        {displayTokens.map((token) => (
          <div
            key={token.symbol}
            className="bg-background/50 rounded-lg p-2 sm:p-3 hover:bg-background/70 transition-colors border border-border/50 min-h-[80px] sm:min-h-[90px]"
          >
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <span className="text-base sm:text-lg">{token.icon}</span>
              <span className="font-medium text-xs sm:text-sm truncate">{token.symbol}</span>
            </div>
            <div className="text-xs text-text-secondary truncate">
              {token.name}
            </div>
            <div className="text-xs text-primary mt-1 capitalize">
              {token.category.replace('_', ' ')}
            </div>
          </div>
        ))}
      </div>

      {/* Category Breakdown - Mobile Optimized */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
        <h4 className="font-medium mb-3 text-sm sm:text-base">Token Categories</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
          {Object.entries(TOKEN_CATEGORIES).map(([category, label]) => {
            const count = getTokensByCategory(category as any).length;
            const tokens = getTokensByCategory(category as any);
            
            return (
              <div key={category} className="bg-background/30 rounded-lg p-3">
                <div className="font-medium mb-1 text-xs sm:text-sm">{label}</div>
                <div className="text-text-secondary text-xs mb-2">{count} tokens</div>
                <div className="flex flex-wrap gap-1">
                  {tokens.slice(0, window.innerWidth < 640 ? 8 : 6).map((token) => (
                    <span key={token.symbol} className="text-xs sm:text-sm">
                      {token.icon}
                    </span>
                  ))}
                  {tokens.length > (window.innerWidth < 640 ? 8 : 6) && (
                    <span className="text-xs text-text-secondary">
                      +{tokens.length - (window.innerWidth < 640 ? 8 : 6)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Features - Mobile Optimized */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
        <h4 className="font-medium mb-3 text-sm sm:text-base">🌟 Key Features</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-400 flex-shrink-0">✅</span>
              <span>50+ Popular Cryptocurrencies</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 flex-shrink-0">✅</span>
              <span>Multi-Chain Support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 flex-shrink-0">✅</span>
              <span>Real-time Price Updates</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 flex-shrink-0">✅</span>
              <span>Smart Price Formatting</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-400 flex-shrink-0">✅</span>
              <span>Category-based Organization</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 flex-shrink-0">✅</span>
              <span>Token-specific Icons</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 flex-shrink-0">✅</span>
              <span>Proper Decimal Handling</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 flex-shrink-0">✅</span>
              <span>No Fiat Dependencies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportedTokensDisplay;