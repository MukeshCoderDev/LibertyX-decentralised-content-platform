import { useCallback } from 'react';
import { useTransactionNotifications } from '../components/NotificationSystem';
import ErrorHandler, { BlockchainError } from '../lib/errorHandler';

export interface UseErrorHandlingReturn {
  handleError: (error: any, context?: string) => BlockchainError;
  handleTransactionError: (error: any, canRetry?: boolean, onRetry?: () => void) => void;
  handleInsufficientFunds: (requiredAmount: string, tokenSymbol: string, currentBalance?: string) => void;
  handleGasEstimationError: (error: any, onRetryWithHigherGas?: () => void) => void;
  handleNetworkError: (error: any) => void;
  handleContractError: (error: any, contractName?: string) => void;
}

export const useErrorHandling = (): UseErrorHandlingReturn => {
  const {
    notifyTransactionError,
    notifyInsufficientFunds,
    notifyGasEstimationFailed,
    notifyNetworkCongestion
  } = useTransactionNotifications();

  const handleError = useCallback((error: any, context?: string): BlockchainError => {
    const parsedError = ErrorHandler.parseError(error);
    
    // Log error with context for debugging
    console.error(`Error in ${context || 'unknown context'}:`, {
      originalError: error,
      parsedError,
      timestamp: new Date().toISOString()
    });

    return parsedError;
  }, []);

  const handleTransactionError = useCallback((
    error: any,
    canRetry: boolean = false,
    onRetry?: () => void
  ) => {
    const parsedError = handleError(error, 'transaction');
    
    // Show appropriate notification based on error type
    switch (parsedError.code) {
      case '4001':
        // User rejected transaction - don't show error notification
        break;
      case 'INSUFFICIENT_FUNDS':
        // This should be handled by handleInsufficientFunds
        break;
      case 'GAS_LIMIT':
      case 'GAS_PRICE':
        notifyGasEstimationFailed(onRetry);
        break;
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        notifyNetworkCongestion();
        break;
      default:
        notifyTransactionError(parsedError.userMessage, canRetry, onRetry);
    }
  }, [handleError, notifyTransactionError, notifyGasEstimationFailed, notifyNetworkCongestion]);

  const handleInsufficientFunds = useCallback((
    requiredAmount: string,
    tokenSymbol: string,
    currentBalance?: string
  ) => {
    const message = currentBalance 
      ? `You have ${currentBalance} ${tokenSymbol} but need ${requiredAmount} ${tokenSymbol}`
      : `You need ${requiredAmount} ${tokenSymbol} to complete this transaction`;
    
    notifyInsufficientFunds(requiredAmount, tokenSymbol);
    
    // Log for analytics
    console.warn('Insufficient funds detected:', {
      required: requiredAmount,
      token: tokenSymbol,
      current: currentBalance,
      timestamp: new Date().toISOString()
    });
  }, [notifyInsufficientFunds]);

  const handleGasEstimationError = useCallback((
    error: any,
    onRetryWithHigherGas?: () => void
  ) => {
    const parsedError = handleError(error, 'gas estimation');
    
    notifyGasEstimationFailed(onRetryWithHigherGas);
    
    // Additional logging for gas estimation failures
    console.warn('Gas estimation failed:', {
      error: parsedError,
      timestamp: new Date().toISOString()
    });
  }, [handleError, notifyGasEstimationFailed]);

  const handleNetworkError = useCallback((error: any) => {
    const parsedError = handleError(error, 'network');
    
    // Determine if it's a congestion issue or connectivity issue
    if (parsedError.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      notifyNetworkCongestion('Network is experiencing high traffic');
    } else {
      notifyTransactionError(parsedError.userMessage, true);
    }
  }, [handleError, notifyNetworkCongestion, notifyTransactionError]);

  const handleContractError = useCallback((error: any, contractName?: string) => {
    const parsedError = handleError(error, `contract: ${contractName || 'unknown'}`);
    
    let userMessage = parsedError.userMessage;
    
    // Enhance error message with contract context
    if (contractName) {
      userMessage = `${contractName} contract error: ${userMessage}`;
    }
    
    // Check for common contract-specific errors
    if (error.message?.includes('revert')) {
      const revertReason = extractRevertReason(error.message);
      if (revertReason) {
        userMessage = `Transaction failed: ${revertReason}`;
      }
    }
    
    notifyTransactionError(userMessage, true);
    
    // Log contract errors with additional context
    console.error('Contract error:', {
      contract: contractName,
      error: parsedError,
      originalMessage: error.message,
      timestamp: new Date().toISOString()
    });
  }, [handleError, notifyTransactionError]);

  return {
    handleError,
    handleTransactionError,
    handleInsufficientFunds,
    handleGasEstimationError,
    handleNetworkError,
    handleContractError
  };
};

// Helper function to extract revert reason from error message
function extractRevertReason(errorMessage: string): string | null {
  // Try to extract revert reason from common error message formats
  const patterns = [
    /revert (.+)/i,
    /execution reverted: (.+)/i,
    /VM Exception while processing transaction: revert (.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

export default useErrorHandling;