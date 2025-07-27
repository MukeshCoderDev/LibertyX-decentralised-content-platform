/**
 * Example usage of the formatters utility functions
 * This file demonstrates how to use the formatting utilities
 */

import { formatToken, shortenAddress, formatTokens, formatTokenSafe } from './formatters';

// Example 1: Token formatting
console.log('=== Token Formatting Examples ===');
console.log(formatToken(100, 'LIB'));        // "100 LIB"
console.log(formatToken('4.02', 'ETH'));     // "4.02 ETH"
console.log(formatToken(16.00, 'BNB'));      // "16 BNB"
console.log(formatToken(1500, 'USDC'));      // "1.5K USDC"
console.log(formatToken(0.0001, 'BTC'));     // "0.0001 BTC"

// Example 2: Address shortening
console.log('\n=== Address Shortening Examples ===');
console.log(shortenAddress('0x9FAF7Fc3b2b7F66c26c1931c993fb86A012345678')); // "0x9faf…5678"
console.log(shortenAddress('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4')); // "0x742d…d4d4"

// Example 3: Multiple tokens
console.log('\n=== Multiple Token Formatting ===');
const tokens = [
  { amount: 100, symbol: 'LIB' },
  { amount: '4.02', symbol: 'ETH' },
  { amount: 16.00, symbol: 'BNB' }
];
console.log(formatTokens(tokens)); // ["100 LIB", "4.02 ETH", "16 BNB"]

// Example 4: Safe formatting with fallbacks
console.log('\n=== Safe Token Formatting ===');
console.log(formatTokenSafe(null, 'LIB'));                    // "0 LIB"
console.log(formatTokenSafe(100, null));                      // "100 TOKEN"
console.log(formatTokenSafe(0, 'ETH', { showZero: false }));  // ""
console.log(formatTokenSafe(0, 'ETH', { showZero: true }));   // "0 ETH"