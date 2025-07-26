import React, { memo, useMemo } from 'react';
import { useStableBalances } from '../hooks/useStableBalances';

interface StableBalanceDisplayProps {
  tokenSymbol?: string;
  showAllTokens?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export const StableBalanceDisplay: React.FC<StableBalanceDisplayProps> = memo(({
  tokenSymbol,
  showAllTokens = false,
  className = '',
  size = 'medium',
  showIcon = true
}) => {
  const { balances, isLoading, error, getTokenBalance } = useStableBalances();

  // Memoize the specific balance to prevent unnecessary re-renders
  const targetBalance = useMemo(() => {
    if (tokenSymbol && !showAllTokens) {
      return getTokenBalance(tokenSymbol);
    }
    return null;
  }, [tokenSymbol, showAllTokens, getTokenBalance]);

  // Memoize the display content
  const displayContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className={`animate-pulse ${className}`}>
          <div className={`bg-gray-200 rounded ${
            size === 'small' ? 'h-4 w-16' : 
            size === 'medium' ? 'h-5 w-20' : 
            'h-6 w-24'
          }`} />
        </div>
      );
    }

    if (error) {
      return (
        <div className={`text-red-500 ${
          size === 'small' ? 'text-xs' : 
          size === 'medium' ? 'text-sm' : 
          'text-base'
        } ${className}`}>
          Error
        </div>
      );
    }

    if (tokenSymbol && !showAllTokens) {
      if (!targetBalance) {
        return (
          <div className={`text-gray-500 ${
            size === 'small' ? 'text-xs' : 
            size === 'medium' ? 'text-sm' : 
            'text-base'
          } ${className}`}>
            0 {tokenSymbol}
          </div>
        );
      }

      return (
        <div className={`flex items-center space-x-1 ${
          size === 'small' ? 'text-xs' : 
          size === 'medium' ? 'text-sm' : 
          'text-base'
        } ${className}`}>
          {showIcon && (
            <TokenIcon symbol={targetBalance.symbol} size={size} />
          )}
          <span className="font-medium">
            {parseFloat(targetBalance.balance).toFixed(4)} {targetBalance.symbol}
          </span>
        </div>
      );
    }

    if (showAllTokens) {
      return (
        <div className={`space-y-1 ${className}`}>
          {balances.map(balance => (
            <div key={balance.symbol} className={`flex items-center space-x-2 ${
              size === 'small' ? 'text-xs' : 
              size === 'medium' ? 'text-sm' : 
              'text-base'
            }`}>
              {showIcon && (
                <TokenIcon symbol={balance.symbol} size={size} />
              )}
              <span className="font-medium">
                {parseFloat(balance.balance).toFixed(4)} {balance.symbol}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // Default: show LIB balance
    const libBalance = getTokenBalance('LIB');
    if (!libBalance) {
      return (
        <div className={`text-gray-500 ${
          size === 'small' ? 'text-xs' : 
          size === 'medium' ? 'text-sm' : 
          'text-base'
        } ${className}`}>
          0 LIB
        </div>
      );
    }

    return (
      <div className={`flex items-center space-x-1 ${
        size === 'small' ? 'text-xs' : 
        size === 'medium' ? 'text-sm' : 
        'text-base'
      } ${className}`}>
        {showIcon && (
          <TokenIcon symbol={libBalance.symbol} size={size} />
        )}
        <span className="font-medium">
          {parseFloat(libBalance.balance).toFixed(4)} {libBalance.symbol}
        </span>
      </div>
    );
  }, [isLoading, error, targetBalance, showAllTokens, balances, tokenSymbol, size, className, showIcon, getTokenBalance]);

  return <>{displayContent}</>;
});

interface TokenIconProps {
  symbol: string;
  size: 'small' | 'medium' | 'large';
}

const TokenIcon: React.FC<TokenIconProps> = memo(({ symbol, size }) => {
  const iconSize = size === 'small' ? 'w-4 h-4' : size === 'medium' ? 'w-5 h-5' : 'w-6 h-6';
  
  const getTokenColor = (symbol: string) => {
    switch (symbol.toLowerCase()) {
      case 'lib':
        return 'bg-purple-500';
      case 'eth':
        return 'bg-blue-500';
      case 'matic':
        return 'bg-purple-600';
      case 'bnb':
        return 'bg-yellow-500';
      case 'avax':
        return 'bg-red-500';
      case 'usdc':
        return 'bg-blue-400';
      case 'usdt':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`${iconSize} ${getTokenColor(symbol)} rounded-full flex items-center justify-center`}>
      <span className="text-white text-xs font-bold">
        {symbol.charAt(0)}
      </span>
    </div>
  );
});