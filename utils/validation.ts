/**
 * Utility functions for balance validation and subscription checks
 */

import { TokenBalance } from '../lib/web3-types';

export interface BalanceValidation {
  hasEnoughBalance: boolean;
  requiredAmount: number;
  currentBalance: number;
  tokenSymbol: string;
  shortfall?: number;
}

export interface SubscriptionValidation {
  canSubscribe: boolean;
  reason?: string;
  requiredBalance?: number;
  currentBalance?: number;
}

/**
 * Checks if user has sufficient balance for a subscription or purchase
 * @param userBalances - Array of user's token balances
 * @param requiredAmount - Required amount for the transaction
 * @param tokenSymbol - Token symbol required (e.g., 'LIB', 'ETH')
 * @returns BalanceValidation object with validation results
 */
export const checkSufficientBalance = (
  userBalances: TokenBalance[],
  requiredAmount: number,
  tokenSymbol: string
): BalanceValidation => {
  // Find the specific token balance
  const tokenBalance = userBalances.find(
    balance => balance.symbol.toLowerCase() === tokenSymbol.toLowerCase()
  );

  const currentBalance = tokenBalance ? parseFloat(tokenBalance.balance) : 0;
  const hasEnoughBalance = currentBalance >= requiredAmount;

  const result: BalanceValidation = {
    hasEnoughBalance,
    requiredAmount,
    currentBalance,
    tokenSymbol,
  };

  // Calculate shortfall if insufficient balance
  if (!hasEnoughBalance) {
    result.shortfall = requiredAmount - currentBalance;
  }

  return result;
};

/**
 * Determines if a Subscribe button should be disabled based on balance
 * @param userBalances - Array of user's token balances
 * @param subscriptionPrice - Price of the subscription
 * @param tokenSymbol - Token symbol required for payment
 * @returns Boolean indicating if button should be disabled
 */
export const shouldDisableSubscribeButton = (
  userBalances: TokenBalance[],
  subscriptionPrice: number,
  tokenSymbol: string = 'LIB'
): boolean => {
  const validation = checkSufficientBalance(userBalances, subscriptionPrice, tokenSymbol);
  return !validation.hasEnoughBalance;
};

/**
 * Gets tooltip message for disabled Subscribe button
 * @param userBalances - Array of user's token balances
 * @param subscriptionPrice - Price of the subscription
 * @param tokenSymbol - Token symbol required for payment
 * @returns Tooltip message string
 */
export const getInsufficientBalanceTooltip = (
  userBalances: TokenBalance[],
  subscriptionPrice: number,
  tokenSymbol: string = 'LIB'
): string => {
  const validation = checkSufficientBalance(userBalances, subscriptionPrice, tokenSymbol);
  
  if (validation.hasEnoughBalance) {
    return '';
  }

  const shortfall = validation.shortfall || 0;
  return `Not enough ${tokenSymbol} tokens. Need ${shortfall.toFixed(4)} more ${tokenSymbol}.`;
};

/**
 * Validates subscription eligibility with detailed feedback
 * @param userBalances - Array of user's token balances
 * @param subscriptionPrice - Price of the subscription
 * @param tokenSymbol - Token symbol required for payment
 * @param isWalletConnected - Whether wallet is connected
 * @returns SubscriptionValidation object with detailed results
 */
export const validateSubscriptionEligibility = (
  userBalances: TokenBalance[],
  subscriptionPrice: number,
  tokenSymbol: string = 'LIB',
  isWalletConnected: boolean = true
): SubscriptionValidation => {
  // Check if wallet is connected
  if (!isWalletConnected) {
    return {
      canSubscribe: false,
      reason: 'Please connect your wallet to subscribe',
    };
  }

  // Check balance
  const balanceValidation = checkSufficientBalance(userBalances, subscriptionPrice, tokenSymbol);
  
  if (!balanceValidation.hasEnoughBalance) {
    return {
      canSubscribe: false,
      reason: `Insufficient ${tokenSymbol} balance`,
      requiredBalance: subscriptionPrice,
      currentBalance: balanceValidation.currentBalance,
    };
  }

  return {
    canSubscribe: true,
  };
};

/**
 * Checks if user has any balance in a specific token
 * @param userBalances - Array of user's token balances
 * @param tokenSymbol - Token symbol to check
 * @returns Boolean indicating if user has any balance
 */
export const hasTokenBalance = (
  userBalances: TokenBalance[],
  tokenSymbol: string
): boolean => {
  const tokenBalance = userBalances.find(
    balance => balance.symbol.toLowerCase() === tokenSymbol.toLowerCase()
  );
  
  return tokenBalance ? parseFloat(tokenBalance.balance) > 0 : false;
};

/**
 * Gets the balance amount for a specific token
 * @param userBalances - Array of user's token balances
 * @param tokenSymbol - Token symbol to get balance for
 * @returns Balance amount as number, 0 if not found
 */
export const getTokenBalance = (
  userBalances: TokenBalance[],
  tokenSymbol: string
): number => {
  const tokenBalance = userBalances.find(
    balance => balance.symbol.toLowerCase() === tokenSymbol.toLowerCase()
  );
  
  return tokenBalance ? parseFloat(tokenBalance.balance) : 0;
};

/**
 * Validates multiple token requirements (e.g., for premium content)
 * @param userBalances - Array of user's token balances
 * @param requirements - Array of token requirements
 * @returns Validation results for each requirement
 */
export const validateMultipleTokenRequirements = (
  userBalances: TokenBalance[],
  requirements: Array<{ amount: number; symbol: string }>
): Array<BalanceValidation & { requirement: { amount: number; symbol: string } }> => {
  return requirements.map(requirement => ({
    ...checkSufficientBalance(userBalances, requirement.amount, requirement.symbol),
    requirement,
  }));
};

/**
 * Checks if user can afford any of multiple payment options
 * @param userBalances - Array of user's token balances
 * @param paymentOptions - Array of payment options with amount and symbol
 * @returns First affordable payment option or null
 */
export const findAffordablePaymentOption = (
  userBalances: TokenBalance[],
  paymentOptions: Array<{ amount: number; symbol: string; label?: string }>
): { amount: number; symbol: string; label?: string } | null => {
  for (const option of paymentOptions) {
    const validation = checkSufficientBalance(userBalances, option.amount, option.symbol);
    if (validation.hasEnoughBalance) {
      return option;
    }
  }
  return null;
};

/**
 * Safe balance validation that handles edge cases
 * @param userBalances - Array of user's token balances (can be null/undefined)
 * @param requiredAmount - Required amount
 * @param tokenSymbol - Token symbol
 * @returns Safe validation result
 */
export const checkSufficientBalanceSafe = (
  userBalances: TokenBalance[] | null | undefined,
  requiredAmount: number,
  tokenSymbol: string
): BalanceValidation => {
  // Handle null/undefined balances
  if (!userBalances || !Array.isArray(userBalances)) {
    return {
      hasEnoughBalance: false,
      requiredAmount,
      currentBalance: 0,
      tokenSymbol,
      shortfall: requiredAmount,
    };
  }

  // Handle invalid required amount
  if (typeof requiredAmount !== 'number' || requiredAmount < 0) {
    return {
      hasEnoughBalance: false,
      requiredAmount: 0,
      currentBalance: 0,
      tokenSymbol,
      shortfall: 0,
    };
  }

  return checkSufficientBalance(userBalances, requiredAmount, tokenSymbol);
};