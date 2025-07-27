import { describe, it, expect } from 'vitest';
import { TokenBalance } from '../lib/web3-types';
import {
  checkSufficientBalance,
  shouldDisableSubscribeButton,
  getInsufficientBalanceTooltip,
  validateSubscriptionEligibility,
  hasTokenBalance,
  getTokenBalance,
  validateMultipleTokenRequirements,
  findAffordablePaymentOption,
  checkSufficientBalanceSafe,
} from '../utils/validation';

// Mock token balances for testing
const mockBalances: TokenBalance[] = [
  { symbol: 'LIB', balance: '100.5', decimals: 18 },
  { symbol: 'ETH', balance: '2.5', decimals: 18 },
  { symbol: 'BNB', balance: '0.1', decimals: 18 },
  { symbol: 'USDC', balance: '500.0', decimals: 6 },
];

const emptyBalances: TokenBalance[] = [];

const zeroBalances: TokenBalance[] = [
  { symbol: 'LIB', balance: '0', decimals: 18 },
  { symbol: 'ETH', balance: '0', decimals: 18 },
];

describe('checkSufficientBalance', () => {
  it('should return true when user has sufficient balance', () => {
    const result = checkSufficientBalance(mockBalances, 50, 'LIB');
    expect(result.hasEnoughBalance).toBe(true);
    expect(result.currentBalance).toBe(100.5);
    expect(result.requiredAmount).toBe(50);
    expect(result.tokenSymbol).toBe('LIB');
    expect(result.shortfall).toBeUndefined();
  });

  it('should return false when user has insufficient balance', () => {
    const result = checkSufficientBalance(mockBalances, 200, 'LIB');
    expect(result.hasEnoughBalance).toBe(false);
    expect(result.currentBalance).toBe(100.5);
    expect(result.requiredAmount).toBe(200);
    expect(result.shortfall).toBe(99.5);
  });

  it('should handle case-insensitive token symbols', () => {
    const result = checkSufficientBalance(mockBalances, 1, 'lib');
    expect(result.hasEnoughBalance).toBe(true);
    expect(result.currentBalance).toBe(100.5);
  });

  it('should return zero balance for non-existent token', () => {
    const result = checkSufficientBalance(mockBalances, 1, 'DOGE');
    expect(result.hasEnoughBalance).toBe(false);
    expect(result.currentBalance).toBe(0);
    expect(result.shortfall).toBe(1);
  });

  it('should handle empty balance array', () => {
    const result = checkSufficientBalance(emptyBalances, 10, 'LIB');
    expect(result.hasEnoughBalance).toBe(false);
    expect(result.currentBalance).toBe(0);
    expect(result.shortfall).toBe(10);
  });
});

describe('shouldDisableSubscribeButton', () => {
  it('should return false when user has sufficient LIB balance', () => {
    const result = shouldDisableSubscribeButton(mockBalances, 50);
    expect(result).toBe(false);
  });

  it('should return true when user has insufficient LIB balance', () => {
    const result = shouldDisableSubscribeButton(mockBalances, 200);
    expect(result).toBe(true);
  });

  it('should work with custom token symbol', () => {
    const result = shouldDisableSubscribeButton(mockBalances, 1, 'ETH');
    expect(result).toBe(false);
  });

  it('should return true for zero balances', () => {
    const result = shouldDisableSubscribeButton(zeroBalances, 1);
    expect(result).toBe(true);
  });
});

describe('getInsufficientBalanceTooltip', () => {
  it('should return empty string when balance is sufficient', () => {
    const result = getInsufficientBalanceTooltip(mockBalances, 50);
    expect(result).toBe('');
  });

  it('should return proper tooltip message when balance is insufficient', () => {
    const result = getInsufficientBalanceTooltip(mockBalances, 200);
    expect(result).toBe('Not enough LIB tokens. Need 99.5000 more LIB.');
  });

  it('should work with custom token symbol', () => {
    const result = getInsufficientBalanceTooltip(mockBalances, 5, 'ETH');
    expect(result).toBe('Not enough ETH tokens. Need 2.5000 more ETH.');
  });

  it('should handle zero balance', () => {
    const result = getInsufficientBalanceTooltip(zeroBalances, 10);
    expect(result).toBe('Not enough LIB tokens. Need 10.0000 more LIB.');
  });
});

describe('validateSubscriptionEligibility', () => {
  it('should return canSubscribe true when wallet connected and balance sufficient', () => {
    const result = validateSubscriptionEligibility(mockBalances, 50, 'LIB', true);
    expect(result.canSubscribe).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should return canSubscribe false when wallet not connected', () => {
    const result = validateSubscriptionEligibility(mockBalances, 50, 'LIB', false);
    expect(result.canSubscribe).toBe(false);
    expect(result.reason).toBe('Please connect your wallet to subscribe');
  });

  it('should return canSubscribe false when balance insufficient', () => {
    const result = validateSubscriptionEligibility(mockBalances, 200, 'LIB', true);
    expect(result.canSubscribe).toBe(false);
    expect(result.reason).toBe('Insufficient LIB balance');
    expect(result.requiredBalance).toBe(200);
    expect(result.currentBalance).toBe(100.5);
  });
});

describe('hasTokenBalance', () => {
  it('should return true when user has token balance', () => {
    expect(hasTokenBalance(mockBalances, 'LIB')).toBe(true);
    expect(hasTokenBalance(mockBalances, 'ETH')).toBe(true);
  });

  it('should return false when user has zero balance', () => {
    expect(hasTokenBalance(zeroBalances, 'LIB')).toBe(false);
  });

  it('should return false when token not found', () => {
    expect(hasTokenBalance(mockBalances, 'DOGE')).toBe(false);
  });

  it('should handle case-insensitive symbols', () => {
    expect(hasTokenBalance(mockBalances, 'lib')).toBe(true);
  });
});

describe('getTokenBalance', () => {
  it('should return correct balance for existing token', () => {
    expect(getTokenBalance(mockBalances, 'LIB')).toBe(100.5);
    expect(getTokenBalance(mockBalances, 'ETH')).toBe(2.5);
  });

  it('should return 0 for non-existent token', () => {
    expect(getTokenBalance(mockBalances, 'DOGE')).toBe(0);
  });

  it('should return 0 for zero balance', () => {
    expect(getTokenBalance(zeroBalances, 'LIB')).toBe(0);
  });

  it('should handle case-insensitive symbols', () => {
    expect(getTokenBalance(mockBalances, 'lib')).toBe(100.5);
  });
});

describe('validateMultipleTokenRequirements', () => {
  it('should validate multiple token requirements', () => {
    const requirements = [
      { amount: 50, symbol: 'LIB' },
      { amount: 1, symbol: 'ETH' },
      { amount: 1000, symbol: 'USDC' },
    ];

    const results = validateMultipleTokenRequirements(mockBalances, requirements);
    
    expect(results).toHaveLength(3);
    expect(results[0].hasEnoughBalance).toBe(true);
    expect(results[1].hasEnoughBalance).toBe(true);
    expect(results[2].hasEnoughBalance).toBe(false);
    expect(results[2].shortfall).toBe(500);
  });

  it('should handle empty requirements', () => {
    const results = validateMultipleTokenRequirements(mockBalances, []);
    expect(results).toHaveLength(0);
  });
});

describe('findAffordablePaymentOption', () => {
  it('should return first affordable payment option', () => {
    const paymentOptions = [
      { amount: 1000, symbol: 'LIB', label: 'Premium' },
      { amount: 1, symbol: 'ETH', label: 'Standard' },
      { amount: 100, symbol: 'USDC', label: 'Basic' },
    ];

    const result = findAffordablePaymentOption(mockBalances, paymentOptions);
    expect(result).toEqual({ amount: 1, symbol: 'ETH', label: 'Standard' });
  });

  it('should return null when no options are affordable', () => {
    const paymentOptions = [
      { amount: 1000, symbol: 'LIB' },
      { amount: 10, symbol: 'ETH' },
    ];

    const result = findAffordablePaymentOption(mockBalances, paymentOptions);
    expect(result).toBeNull();
  });

  it('should handle empty payment options', () => {
    const result = findAffordablePaymentOption(mockBalances, []);
    expect(result).toBeNull();
  });
});

describe('checkSufficientBalanceSafe', () => {
  it('should handle null balances', () => {
    const result = checkSufficientBalanceSafe(null, 10, 'LIB');
    expect(result.hasEnoughBalance).toBe(false);
    expect(result.currentBalance).toBe(0);
    expect(result.shortfall).toBe(10);
  });

  it('should handle undefined balances', () => {
    const result = checkSufficientBalanceSafe(undefined, 10, 'LIB');
    expect(result.hasEnoughBalance).toBe(false);
    expect(result.currentBalance).toBe(0);
    expect(result.shortfall).toBe(10);
  });

  it('should handle invalid required amount', () => {
    const result = checkSufficientBalanceSafe(mockBalances, -5, 'LIB');
    expect(result.hasEnoughBalance).toBe(false);
    expect(result.requiredAmount).toBe(0);
    expect(result.currentBalance).toBe(0);
  });

  it('should work normally with valid inputs', () => {
    const result = checkSufficientBalanceSafe(mockBalances, 50, 'LIB');
    expect(result.hasEnoughBalance).toBe(true);
    expect(result.currentBalance).toBe(100.5);
  });
});