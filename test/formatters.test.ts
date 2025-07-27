import { describe, it, expect } from 'vitest';
import { 
  formatToken, 
  shortenAddress, 
  formatTokens, 
  formatTokenSafe, 
  isValidAddress, 
  formatBalance 
} from '../utils/formatters';

describe('formatToken', () => {
  it('should format token amounts with proper spacing', () => {
    expect(formatToken(16.00, 'BNB')).toBe('16 BNB');
    expect(formatToken('4.02', 'ETH')).toBe('4.02 ETH');
    expect(formatToken(100, 'LIB')).toBe('100 LIB');
  });

  it('should handle zero amounts', () => {
    expect(formatToken(0, 'LIB')).toBe('0 LIB');
    expect(formatToken('0', 'ETH')).toBe('0 ETH');
  });

  it('should format large amounts with K/M suffixes', () => {
    expect(formatToken(1500, 'LIB')).toBe('1.5K LIB');
    expect(formatToken(2500000, 'ETH')).toBe('2.5M ETH');
  });

  it('should format small amounts with appropriate decimals', () => {
    expect(formatToken(0.1234, 'LIB')).toBe('0.1234 LIB');
    expect(formatToken(0.0001, 'ETH')).toBe('0.0001 ETH');
  });

  it('should remove trailing zeros', () => {
    expect(formatToken(1.00, 'LIB')).toBe('1 LIB');
    expect(formatToken(1.50, 'ETH')).toBe('1.5 ETH');
  });

  it('should handle invalid inputs', () => {
    expect(formatToken('invalid', 'LIB')).toBe('0 LIB');
    expect(formatToken(NaN, 'ETH')).toBe('0 ETH');
    expect(formatToken(100, '')).toBe('0');
  });
});

describe('shortenAddress', () => {
  it('should shorten addresses with proper format', () => {
    const address = '0x9FAF7Fc3b2b7F66c26c1931c993fb86A0';
    expect(shortenAddress(address)).toBe('0x9faf…86a0');
  });

  it('should handle mixed case addresses consistently', () => {
    const address1 = '0x9FAF7Fc3b2b7F66c26c1931c993fb86A0';
    const address2 = '0x9faf7fc3b2b7f66c26c1931c993fb86a0';
    expect(shortenAddress(address1)).toBe('0x9faf…86a0');
    expect(shortenAddress(address2)).toBe('0x9faf…86a0');
  });

  it('should handle full-length addresses', () => {
    const fullAddress = '0x9FAF7Fc3b2b7F66c26c1931c993fb86A012345678';
    expect(shortenAddress(fullAddress)).toBe('0x9faf…5678');
  });

  it('should handle short addresses', () => {
    const shortAddress = '0x9FAF86A0';
    expect(shortenAddress(shortAddress)).toBe('0x9faf86a0');
  });

  it('should handle invalid inputs', () => {
    expect(shortenAddress('')).toBe('');
    expect(shortenAddress('invalid')).toBe('invalid');
    expect(shortenAddress('0x123')).toBe('0x123');
  });

  it('should handle null/undefined inputs', () => {
    expect(shortenAddress(null as any)).toBe('');
    expect(shortenAddress(undefined as any)).toBe('');
  });
});

describe('formatTokens', () => {
  it('should format multiple tokens consistently', () => {
    const tokens = [
      { amount: 100, symbol: 'LIB' },
      { amount: '4.02', symbol: 'ETH' },
      { amount: 16.00, symbol: 'BNB' }
    ];
    
    const result = formatTokens(tokens);
    expect(result).toEqual(['100 LIB', '4.02 ETH', '16 BNB']);
  });

  it('should handle empty array', () => {
    expect(formatTokens([])).toEqual([]);
  });
});

describe('formatTokenSafe', () => {
  it('should handle null/undefined amounts', () => {
    expect(formatTokenSafe(null, 'LIB')).toBe('0 LIB');
    expect(formatTokenSafe(undefined, 'ETH')).toBe('0 ETH');
  });

  it('should handle null/undefined symbols', () => {
    expect(formatTokenSafe(100, null)).toBe('100 TOKEN');
    expect(formatTokenSafe(100, undefined)).toBe('100 TOKEN');
  });

  it('should use fallback values', () => {
    expect(formatTokenSafe(null, null, { 
      fallbackAmount: 50, 
      fallbackSymbol: 'CUSTOM' 
    })).toBe('50 CUSTOM');
  });

  it('should handle showZero option', () => {
    expect(formatTokenSafe(0, 'LIB', { showZero: false })).toBe('');
    expect(formatTokenSafe(0, 'LIB', { showZero: true })).toBe('0 LIB');
  });
});

describe('isValidAddress', () => {
  it('should validate correct addresses', () => {
    expect(isValidAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4')).toBe(true);
    expect(isValidAddress('0x0000000000000000000000000000000000000000')).toBe(true);
  });

  it('should reject invalid addresses', () => {
    expect(isValidAddress('')).toBe(false);
    expect(isValidAddress('invalid')).toBe(false);
    expect(isValidAddress('0x123')).toBe(false);
    expect(isValidAddress('742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4')).toBe(false);
  });

  it('should handle null/undefined inputs', () => {
    expect(isValidAddress(null as any)).toBe(false);
    expect(isValidAddress(undefined as any)).toBe(false);
  });
});

describe('formatBalance', () => {
  it('should format balance objects', () => {
    const balance = { balance: '100.5', symbol: 'LIB' };
    expect(formatBalance(balance)).toBe('100.5 LIB');
  });

  it('should handle null balance', () => {
    expect(formatBalance(null)).toBe('0 TOKEN');
  });

  it('should handle zero balance', () => {
    const balance = { balance: '0', symbol: 'ETH' };
    expect(formatBalance(balance)).toBe('0 ETH');
  });
});