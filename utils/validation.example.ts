/**
 * Example usage of the validation utility functions
 * This file demonstrates how to use the balance validation utilities
 */

import { TokenBalance } from '../lib/web3-types';
import {
  checkSufficientBalance,
  shouldDisableSubscribeButton,
  getInsufficientBalanceTooltip,
  validateSubscriptionEligibility,
} from './validation';

// Example user balances
const userBalances: TokenBalance[] = [
  { symbol: 'LIB', balance: '50.5', decimals: 18 },
  { symbol: 'ETH', balance: '1.2', decimals: 18 },
  { symbol: 'BNB', balance: '0.1', decimals: 18 },
];

// Example 1: Check if user can afford a 100 LIB subscription
console.log('=== Balance Validation Examples ===');
const subscriptionPrice = 100;
const validation = checkSufficientBalance(userBalances, subscriptionPrice, 'LIB');
console.log('Can afford 100 LIB subscription:', validation.hasEnoughBalance); // false
console.log('Current LIB balance:', validation.currentBalance); // 50.5
console.log('Shortfall:', validation.shortfall); // 49.5

// Example 2: Check if Subscribe button should be disabled
console.log('\n=== Subscribe Button State ===');
const shouldDisable = shouldDisableSubscribeButton(userBalances, subscriptionPrice);
console.log('Should disable Subscribe button:', shouldDisable); // true

// Example 3: Get tooltip message for insufficient balance
console.log('\n=== Tooltip Messages ===');
const tooltip = getInsufficientBalanceTooltip(userBalances, subscriptionPrice);
console.log('Tooltip message:', tooltip); // "Not enough LIB tokens. Need 49.5000 more LIB."

// Example 4: Comprehensive subscription validation
console.log('\n=== Subscription Eligibility ===');
const eligibility = validateSubscriptionEligibility(userBalances, subscriptionPrice, 'LIB', true);
console.log('Can subscribe:', eligibility.canSubscribe); // false
console.log('Reason:', eligibility.reason); // "Insufficient LIB balance"
console.log('Required balance:', eligibility.requiredBalance); // 100
console.log('Current balance:', eligibility.currentBalance); // 50.5

// Example 5: Check affordable subscription (25 LIB)
console.log('\n=== Affordable Subscription ===');
const affordablePrice = 25;
const affordableValidation = checkSufficientBalance(userBalances, affordablePrice, 'LIB');
console.log('Can afford 25 LIB subscription:', affordableValidation.hasEnoughBalance); // true

const affordableEligibility = validateSubscriptionEligibility(userBalances, affordablePrice, 'LIB', true);
console.log('Can subscribe to 25 LIB plan:', affordableEligibility.canSubscribe); // true