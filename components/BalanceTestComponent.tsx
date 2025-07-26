import React, { memo } from 'react';
import { StableBalanceDisplay } from './StableBalanceDisplay';

// Test component to verify balance display works without blinking
export const BalanceTestComponent: React.FC = memo(() => {
  return (
    <div className="p-4 bg-card rounded-lg">
      <h3 className="text-lg font-bold mb-4">Balance Test (Should not blink)</h3>
      <div className="space-y-2">
        <div className="flex items-center space-x-4">
          <span>LIB Balance:</span>
          <StableBalanceDisplay tokenSymbol="LIB" size="medium" />
        </div>
        <div className="flex items-center space-x-4">
          <span>ETH Balance:</span>
          <StableBalanceDisplay tokenSymbol="ETH" size="medium" />
        </div>
        <div className="flex items-center space-x-4">
          <span>All Balances:</span>
          <StableBalanceDisplay showAllTokens={true} size="small" />
        </div>
      </div>
    </div>
  );
});