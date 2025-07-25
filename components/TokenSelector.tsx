import React, { useState } from 'react';
import { getAllTokens, getTokensByCategory, TOKEN_CATEGORIES, TokenConfig } from '../lib/tokenConfig';

interface TokenSelectorProps {
  selectedToken: string;
  onTokenSelect: (token: string) => void;
  showBalance?: boolean;
  balances?: Record<string, string>;
  disabled?: boolean;
  className?: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onTokenSelect,
  showBalance = false,
  balances = {},
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const allTokens = getAllTokens();
  const selectedTokenConfig = allTokens.find(t => t.symbol === selectedToken);

  const filteredTokens = allTokens.filter(token =>
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTokenSelect = (token: TokenConfig) => {
    onTokenSelect(token.symbol);
    setIsOpen(false);
    setSearchTerm('');
  };

  const formatBalance = (token: TokenConfig): string => {
    const balance = balances[token.symbol];
    if (!balance || balance === '0') return '0';
    
    const value = parseFloat(balance) / Math.pow(10, token.decimals);
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    } else if (value >= 1) {
      return value.toFixed(4);
    } else if (value >= 0.0001) {
      return value.toFixed(6);
    } else {
      return value.toExponential(2);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Token Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full bg-background border border-border rounded-lg px-3 py-2 text-left text-white focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'
        }`}
      >
        <div className="flex items-center gap-2">
          {selectedTokenConfig ? (
            <>
              <span className="text-lg">{selectedTokenConfig.icon}</span>
              <div>
                <span className="font-medium">{selectedTokenConfig.symbol}</span>
                <span className="text-text-secondary text-sm ml-2">{selectedTokenConfig.name}</span>
                {showBalance && balances[selectedToken] && (
                  <span className="text-green-400 text-sm ml-2">
                    {formatBalance(selectedTokenConfig)}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-text-secondary">Select a token</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown - Mobile Optimized */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 sm:max-h-96 overflow-hidden">
          {/* Search - Mobile Optimized */}
          <div className="p-2 sm:p-3 border-b border-border">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px]"
            />
          </div>

          {/* Token List - Mobile Optimized */}
          <div className="max-h-64 sm:max-h-80 overflow-y-auto">
            {searchTerm ? (
              // Show filtered results
              <div className="p-1 sm:p-2">
                {filteredTokens.length > 0 ? (
                  filteredTokens.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => handleTokenSelect(token)}
                      className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-2 hover:bg-background/50 rounded text-left min-h-[44px]"
                    >
                      <span className="text-base sm:text-lg flex-shrink-0">{token.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base truncate">{token.symbol}</div>
                        <div className="text-xs sm:text-sm text-text-secondary truncate">{token.name}</div>
                      </div>
                      {showBalance && balances[token.symbol] && (
                        <div className="text-xs sm:text-sm text-green-400 flex-shrink-0">
                          {formatBalance(token)}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-text-secondary text-sm">
                    No tokens found matching "{searchTerm}"
                  </div>
                )}
              </div>
            ) : (
              // Show by categories
              Object.entries(TOKEN_CATEGORIES).map(([category, label]) => {
                const categoryTokens = getTokensByCategory(category as any);
                return (
                  <div key={category}>
                    <div className="px-2 sm:px-3 py-2 text-xs font-medium text-text-secondary bg-background/30 border-b border-border sticky top-0">
                      {label}
                    </div>
                    <div className="p-1 sm:p-2">
                      {categoryTokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => handleTokenSelect(token)}
                          className={`w-full flex items-center gap-2 sm:gap-3 p-2 hover:bg-background/50 rounded text-left min-h-[44px] ${
                            selectedToken === token.symbol ? 'bg-primary/20' : ''
                          }`}
                        >
                          <span className="text-base sm:text-lg flex-shrink-0">{token.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm sm:text-base truncate">{token.symbol}</div>
                            <div className="text-xs sm:text-sm text-text-secondary truncate">{token.name}</div>
                          </div>
                          {showBalance && balances[token.symbol] && (
                            <div className="text-xs sm:text-sm text-green-400 flex-shrink-0">
                              {formatBalance(token)}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TokenSelector;