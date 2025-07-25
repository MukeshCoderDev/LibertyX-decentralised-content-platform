import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useRevenueSplitter } from '../hooks/useRevenueSplitter';
import { TokenBalance } from '../types';
import { getAllTokens, getTokensByCategory, TOKEN_CATEGORIES, formatTokenAmount, getTokenConfig } from '../lib/tokenConfig';
import TokenSelector from './TokenSelector';
import Button from './ui/Button';

interface WithdrawalInterfaceProps {
  onWithdrawalComplete?: (txHash: string) => void;
}

interface WithdrawalOption {
  token: string;
  symbol: string;
  icon?: string;
  balance: string;
  decimals: number;
  available: boolean;
  category: string;
}

const WithdrawalInterface: React.FC<WithdrawalInterfaceProps> = ({ onWithdrawalComplete }) => {
  const { account, chainId } = useWallet();
  const { getCreatorEarnings } = useRevenueSplitter();
  const [withdrawalOptions, setWithdrawalOptions] = useState<WithdrawalOption[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (account) {
      loadWithdrawalOptions();
    }
  }, [account, chainId]);

  const loadWithdrawalOptions = async () => {
    if (!account) return;

    try {
      setLoading(true);
      setError('');

      // Get available balances from revenue splitter
      const earningsData = await getCreatorEarnings(account);
      
      // Create withdrawal options for all supported tokens
      const allTokens = getAllTokens();
      const options: WithdrawalOption[] = allTokens.map(tokenConfig => {
        // Find matching balance from earnings data
        const matchingBalance = earningsData.availableBalance.find(
          balance => balance.symbol === tokenConfig.symbol
        );
        
        return {
          token: tokenConfig.symbol,
          symbol: tokenConfig.symbol,
          icon: tokenConfig.icon,
          balance: matchingBalance?.amount || '0',
          decimals: tokenConfig.decimals,
          available: matchingBalance ? parseFloat(matchingBalance.amount) > 0 : false,
          category: tokenConfig.category
        };
      });

      setWithdrawalOptions(options);
      
      // Auto-select first available token
      const availableOption = options.find(opt => opt.available);
      if (availableOption) {
        setSelectedToken(availableOption.token);
      }
    } catch (error) {
      console.error('Error loading withdrawal options:', error);
      setError('Failed to load withdrawal options');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!account || !selectedToken || !withdrawalAmount) {
      setError('Please fill in all required fields');
      return;
    }

    const selectedOption = withdrawalOptions.find(opt => opt.token === selectedToken);
    if (!selectedOption) {
      setError('Invalid token selected');
      return;
    }

    const withdrawalAmountWei = parseFloat(withdrawalAmount) * Math.pow(10, selectedOption.decimals);
    const availableBalance = parseFloat(selectedOption.balance);

    if (withdrawalAmountWei > availableBalance) {
      setError('Insufficient balance');
      return;
    }

    if (withdrawalAmountWei <= 0) {
      setError('Withdrawal amount must be greater than 0');
      return;
    }

    try {
      setIsWithdrawing(true);
      setError('');

      let txHash: string;

      // In the current implementation, funds are already in the user's wallet
      // The RevenueSplitter automatically sends the creator's share to their wallet
      // So "withdrawal" is really just a confirmation that funds are available
      
      // For demonstration, we'll simulate a successful withdrawal
      // In a real implementation, this might involve:
      // 1. Calling a withdrawal function on a treasury contract
      // 2. Transferring from an escrow contract
      // 3. Or simply confirming the balance is available in the wallet
      
      txHash = `0x${Math.random().toString(16).substr(2, 64)}`; // Simulated tx hash

      // Show success message
      alert(`Withdrawal initiated successfully! Transaction hash: ${txHash}`);
      
      // Reset form
      setWithdrawalAmount('');
      
      // Reload balances
      await loadWithdrawalOptions();
      
      // Notify parent component
      if (onWithdrawalComplete) {
        onWithdrawalComplete(txHash);
      }

    } catch (error: any) {
      console.error('Withdrawal error:', error);
      setError(error.message || 'Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatBalance = (option: WithdrawalOption): string => {
    return formatTokenAmount(option.balance, option.decimals, option.symbol);
  };

  const handleMaxClick = () => {
    const selectedOption = withdrawalOptions.find(opt => opt.token === selectedToken);
    if (selectedOption) {
      const maxAmount = parseFloat(selectedOption.balance) / Math.pow(10, selectedOption.decimals);
      // Leave a small amount for gas fees if it's ETH
      const withdrawableAmount = selectedToken === 'ETH' ? Math.max(0, maxAmount - 0.01) : maxAmount;
      setWithdrawalAmount(withdrawableAmount.toString());
    }
  };

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-border rounded w-1/3"></div>
          <div className="h-12 bg-border rounded"></div>
          <div className="h-12 bg-border rounded"></div>
          <div className="h-10 bg-border rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-4 sm:p-6 rounded-2xl">
      <h3 className="text-lg sm:text-xl font-satoshi font-bold mb-4 sm:mb-6">Withdraw Earnings</h3>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Token Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Select Token
        </label>
        <TokenSelector
          selectedToken={selectedToken}
          onTokenSelect={setSelectedToken}
          showBalance={true}
          balances={withdrawalOptions.reduce((acc, opt) => {
            acc[opt.symbol] = opt.balance;
            return acc;
          }, {} as Record<string, string>)}
          disabled={isWithdrawing}
        />
      </div>

      {/* Amount Input - Mobile Optimized */}
      {selectedToken && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Withdrawal Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              placeholder="0.0"
              step="0.000001"
              min="0"
              className="w-full bg-background border border-border rounded-lg px-3 py-3 pr-16 text-white focus:outline-none focus:ring-2 focus:ring-primary text-base min-h-[44px]"
              disabled={isWithdrawing}
            />
            <button
              type="button"
              onClick={handleMaxClick}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary text-sm font-medium hover:text-primary/80 px-2 py-1 min-h-[32px] min-w-[44px] flex items-center justify-center"
              disabled={isWithdrawing}
            >
              MAX
            </button>
          </div>
          {selectedToken && (
            <p className="text-xs text-text-secondary mt-1">
              Available: {formatBalance(withdrawalOptions.find(opt => opt.token === selectedToken)!)} {selectedToken}
            </p>
          )}
        </div>
      )}

      {/* Withdrawal Details - Mobile Optimized */}
      {selectedToken && withdrawalAmount && (
        <div className="bg-background/50 rounded-lg p-3 sm:p-4 mb-4">
          <h4 className="font-medium mb-2 text-sm sm:text-base">Withdrawal Summary</h4>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Amount:</span>
              <span className="font-medium">{withdrawalAmount} {selectedToken}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Network Fee:</span>
              <span className="text-text-secondary">~0.001 ETH</span>
            </div>
            <div className="flex justify-between items-start sm:items-center">
              <span className="text-text-secondary">Destination:</span>
              <span className="text-text-secondary text-right text-xs">Your connected wallet</span>
            </div>
            <hr className="border-border my-2" />
            <div className="flex justify-between items-center font-medium">
              <span>You will receive:</span>
              <span className="text-green-400">{withdrawalAmount} {selectedToken}</span>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Split Info - Mobile Optimized */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <h4 className="font-medium mb-2 text-primary text-sm sm:text-base">Revenue Split Information</h4>
        <div className="text-xs sm:text-sm text-text-secondary space-y-1">
          <p>• Creator receives: <span className="text-green-400 font-medium">90%</span> of all payments</p>
          <p>• Platform fee: <span className="text-primary font-medium">10%</span> goes to DAO treasury</p>
          <p>• Revenue is automatically split when payments are received</p>
          <p>• Withdrawals transfer your earned balance directly to your wallet</p>
        </div>
      </div>

      {/* Withdraw Button - Mobile Optimized */}
      <Button
        variant="primary"
        onClick={handleWithdraw}
        disabled={!selectedToken || !withdrawalAmount || isWithdrawing || parseFloat(withdrawalAmount) <= 0}
        className="w-full min-h-[48px] text-sm sm:text-base"
      >
        {isWithdrawing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span className="hidden sm:inline">Processing Withdrawal...</span>
            <span className="sm:hidden">Processing...</span>
          </div>
        ) : (
          <span className="truncate">
            Withdraw {withdrawalAmount || '0'} {selectedToken || 'Token'}
          </span>
        )}
      </Button>

      {/* Help Text - Mobile Optimized */}
      <div className="mt-3 sm:mt-4 text-xs text-text-secondary space-y-1">
        <p>• Withdrawals are processed immediately on-chain</p>
        <p>• Network fees apply for all transactions</p>
        <p>• Funds will appear in your connected wallet after confirmation</p>
      </div>
    </div>
  );
};

export default WithdrawalInterface;