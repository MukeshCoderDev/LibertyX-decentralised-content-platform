import { ethers } from 'ethers';

export interface ErrorDetails {
  type: 'network' | 'contract' | 'user' | 'validation' | 'unknown';
  message: string;
  originalError?: any;
  code?: string | number;
  retryable: boolean;
  userFriendly: string;
  suggestions: string[];
}

export class ErrorHandler {
  /**
   * Parse and categorize errors from various sources
   */
  static parseError(error: any): ErrorDetails {
    // Handle ethers.js errors
    if (error.code) {
      return this.parseEthersError(error);
    }

    // Handle contract execution errors
    if (error.reason) {
      return this.parseContractError(error);
    }

    // Handle network errors
    if (error.message && (
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('timeout')
    )) {
      return this.parseNetworkError(error);
    }

    // Handle validation errors
    if (error.message && (
      error.message.includes('validation') ||
      error.message.includes('invalid') ||
      error.message.includes('required')
    )) {
      return this.parseValidationError(error);
    }

    // Default unknown error
    return {
      type: 'unknown',
      message: error.message || 'An unknown error occurred',
      originalError: error,
      retryable: true,
      userFriendly: 'Something went wrong. Please try again.',
      suggestions: [
        'Try refreshing the page',
        'Check your internet connection',
        'Contact support if the problem persists'
      ]
    };
  }

  private static parseEthersError(error: any): ErrorDetails {
    const code = error.code;
    const message = error.message || '';

    switch (code) {
      case 'ACTION_REJECTED':
      case 4001:
        return {
          type: 'user',
          message: 'Transaction rejected by user',
          code,
          retryable: true,
          userFriendly: 'You cancelled the transaction',
          suggestions: [
            'Try the transaction again',
            'Make sure you approve the transaction in your wallet'
          ]
        };

      case 'INSUFFICIENT_FUNDS':
      case -32000:
        return {
          type: 'user',
          message: 'Insufficient funds',
          code,
          retryable: false,
          userFriendly: 'You don\'t have enough ETH for this transaction',
          suggestions: [
            'Add more ETH to your wallet',
            'Try a smaller amount',
            'Check gas fees and adjust accordingly'
          ]
        };

      case 'UNPREDICTABLE_GAS_LIMIT':
        return {
          type: 'contract',
          message: 'Gas estimation failed',
          code,
          retryable: true,
          userFriendly: 'Transaction may fail due to gas estimation issues',
          suggestions: [
            'Try again with a higher gas limit',
            'Check if the contract function is available',
            'Verify your transaction parameters'
          ]
        };

      case 'NETWORK_ERROR':
        return {
          type: 'network',
          message: 'Network connection error',
          code,
          retryable: true,
          userFriendly: 'Network connection problem',
          suggestions: [
            'Check your internet connection',
            'Try switching networks and back',
            'Wait a moment and try again'
          ]
        };

      default:
        return {
          type: 'unknown',
          message: message,
          code,
          retryable: true,
          userFriendly: 'Transaction failed',
          suggestions: [
            'Try the transaction again',
            'Check your wallet connection',
            'Verify you\'re on the correct network'
          ]
        };
    }
  }

  private static parseContractError(error: any): ErrorDetails {
    const reason = error.reason || '';
    const message = error.message || '';

    // Common contract error patterns
    if (reason.includes('no plan')) {
      return {
        type: 'contract',
        message: 'No subscription plan found',
        originalError: error,
        retryable: false,
        userFriendly: 'This creator hasn\'t set up a subscription plan yet',
        suggestions: [
          'Contact the creator to set up their subscription plan',
          'Check back later',
          'Try a different creator'
        ]
      };
    }

    if (reason.includes('wrong amount')) {
      return {
        type: 'validation',
        message: 'Incorrect payment amount',
        originalError: error,
        retryable: true,
        userFriendly: 'The payment amount doesn\'t match the subscription price',
        suggestions: [
          'Refresh the page to get the latest price',
          'Make sure you\'re paying the exact amount required',
          'Check if the subscription plan has changed'
        ]
      };
    }

    if (reason.includes('!exists')) {
      return {
        type: 'contract',
        message: 'Resource does not exist',
        originalError: error,
        retryable: false,
        userFriendly: 'The requested item no longer exists',
        suggestions: [
          'Refresh the page to see current items',
          'Check if the item was removed',
          'Try a different item'
        ]
      };
    }

    return {
      type: 'contract',
      message: reason || message,
      originalError: error,
      retryable: true,
      userFriendly: 'Smart contract operation failed',
      suggestions: [
        'Try the operation again',
        'Check if you meet all requirements',
        'Verify your wallet is connected to the correct network'
      ]
    };
  }

  private static parseNetworkError(error: any): ErrorDetails {
    return {
      type: 'network',
      message: error.message,
      originalError: error,
      retryable: true,
      userFriendly: 'Network connection problem',
      suggestions: [
        'Check your internet connection',
        'Try switching to a different network and back',
        'Wait a moment and try again',
        'Try using a different RPC endpoint'
      ]
    };
  }

  private static parseValidationError(error: any): ErrorDetails {
    return {
      type: 'validation',
      message: error.message,
      originalError: error,
      retryable: true,
      userFriendly: 'Invalid input provided',
      suggestions: [
        'Check your input values',
        'Make sure all required fields are filled',
        'Verify the format of your inputs'
      ]
    };
  }

  /**
   * Create a retry mechanism with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const errorDetails = this.parseError(error);

        // Don't retry non-retryable errors
        if (!errorDetails.retryable) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Log errors with context
   */
  static logError(error: any, context: string, additionalInfo?: any) {
    const errorDetails = this.parseError(error);
    
    console.group(`🚨 Error in ${context}`);
    console.error('Error Details:', errorDetails);
    console.error('Original Error:', error);
    if (additionalInfo) {
      console.error('Additional Info:', additionalInfo);
    }
    console.groupEnd();

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { errorDetails, context, additionalInfo } });
    }
  }
}

export default ErrorHandler;