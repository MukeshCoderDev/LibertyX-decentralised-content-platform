export interface BlockchainError {
  code: string | number;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedAction?: string;
}

export class ErrorHandler {
  private static errorMap: Record<string, Partial<BlockchainError>> = {
    // MetaMask/Wallet Errors
    '4001': {
      userMessage: 'Transaction was rejected by user',
      severity: 'low',
      actionable: true,
      suggestedAction: 'Please approve the transaction to continue'
    },
    '4100': {
      userMessage: 'Requested method is not supported by wallet',
      severity: 'medium',
      actionable: false,
      suggestedAction: 'Try using a different wallet or update your current wallet'
    },
    '4200': {
      userMessage: 'Wallet is not connected to the requested network',
      severity: 'medium',
      actionable: true,
      suggestedAction: 'Please switch to the correct network in your wallet'
    },
    '4900': {
      userMessage: 'Wallet is disconnected',
      severity: 'medium',
      actionable: true,
      suggestedAction: 'Please reconnect your wallet'
    },
    '4901': {
      userMessage: 'Wallet does not support the requested network',
      severity: 'medium',
      actionable: true,
      suggestedAction: 'Please add the network to your wallet or use a different wallet'
    },
    
    // Gas and Transaction Errors
    'INSUFFICIENT_FUNDS': {
      userMessage: 'Insufficient funds for transaction',
      severity: 'high',
      actionable: true,
      suggestedAction: 'Add more funds to your wallet or reduce the transaction amount'
    },
    'GAS_LIMIT': {
      userMessage: 'Transaction requires too much gas',
      severity: 'medium',
      actionable: true,
      suggestedAction: 'Try increasing the gas limit or wait for network congestion to reduce'
    },
    'GAS_PRICE': {
      userMessage: 'Gas price too low for current network conditions',
      severity: 'medium',
      actionable: true,
      suggestedAction: 'Increase the gas price to speed up transaction processing'
    },
    'NONCE_EXPIRED': {
      userMessage: 'Transaction nonce is outdated',
      severity: 'medium',
      actionable: true,
      suggestedAction: 'Please try the transaction again'
    },
    'REPLACEMENT_UNDERPRICED': {
      userMessage: 'Replacement transaction gas price too low',
      severity: 'medium',
      actionable: true,
      suggestedAction: 'Increase the gas price to replace the pending transaction'
    },
    
    // Network Errors
    'NETWORK_ERROR': {
      userMessage: 'Network connection error',
      severity: 'high',
      actionable: true,
      suggestedAction: 'Check your internet connection and try again'
    },
    'TIMEOUT': {
      userMessage: 'Transaction timed out',
      severity: 'medium',
      actionable: true,
      suggestedAction: 'The network may be congested. Please try again later'
    },
    'SERVER_ERROR': {
      userMessage: 'Blockchain network is experiencing issues',
      severity: 'high',
      actionable: true,
      suggestedAction: 'Please try again in a few minutes'
    },
    
    // Contract Errors
    'CALL_EXCEPTION': {
      userMessage: 'Smart contract call failed',
      severity: 'medium',
      actionable: true,
      suggestedAction: 'Please check your inputs and try again'
    },
    'UNPREDICTABLE_GAS_LIMIT': {
      userMessage: 'Cannot estimate gas for this transaction',
      severity: 'medium',
      actionable: true,
      suggestedAction: 'The transaction may fail. Please check your inputs or try again later'
    },
    
    // Custom Application Errors
    'INSUFFICIENT_BALANCE': {
      userMessage: 'Insufficient token balance',
      severity: 'high',
      actionable: true,
      suggestedAction: 'You need more tokens to complete this transaction'
    },
    'INVALID_AMOUNT': {
      userMessage: 'Invalid transaction amount',
      severity: 'medium',
      actionable: true,
      suggestedAction: 'Please enter a valid amount greater than 0'
    },
    'CONTRACT_NOT_FOUND': {
      userMessage: 'Smart contract not available',
      severity: 'high',
      actionable: false,
      suggestedAction: 'Please contact support if this issue persists'
    },
    'WALLET_NOT_CONNECTED': {
      userMessage: 'Wallet not connected',
      severity: 'medium',
      actionable: true,
      suggestedAction: 'Please connect your wallet to continue'
    }
  };

  static parseError(error: any): BlockchainError {
    let code = 'UNKNOWN_ERROR';
    let message = 'An unknown error occurred';
    
    // Extract error information from different error formats
    if (error?.code) {
      code = error.code.toString();
    } else if (error?.reason) {
      code = error.reason;
    } else if (error?.message) {
      // Try to extract common error patterns from message
      const msg = error.message.toLowerCase();
      if (msg.includes('insufficient funds')) {
        code = 'INSUFFICIENT_FUNDS';
      } else if (msg.includes('gas')) {
        if (msg.includes('limit')) code = 'GAS_LIMIT';
        else if (msg.includes('price')) code = 'GAS_PRICE';
      } else if (msg.includes('nonce')) {
        code = 'NONCE_EXPIRED';
      } else if (msg.includes('network') || msg.includes('connection')) {
        code = 'NETWORK_ERROR';
      } else if (msg.includes('timeout')) {
        code = 'TIMEOUT';
      } else if (msg.includes('rejected') || msg.includes('denied')) {
        code = '4001';
      }
    }

    if (error?.message) {
      message = error.message;
    }

    // Get predefined error info or use defaults
    const errorInfo = this.errorMap[code] || {
      userMessage: 'An unexpected error occurred',
      severity: 'medium' as const,
      actionable: true,
      suggestedAction: 'Please try again or contact support if the issue persists'
    };

    return {
      code,
      message,
      userMessage: errorInfo.userMessage!,
      severity: errorInfo.severity!,
      actionable: errorInfo.actionable!,
      suggestedAction: errorInfo.suggestedAction
    };
  }

  static getGasEstimationError(estimatedGas?: bigint, userBalance?: bigint): BlockchainError | null {
    if (!estimatedGas || !userBalance) return null;
    
    if (userBalance < estimatedGas) {
      return {
        code: 'INSUFFICIENT_GAS_FUNDS',
        message: 'Insufficient funds for gas',
        userMessage: `You need at least ${estimatedGas.toString()} wei for gas fees`,
        severity: 'high',
        actionable: true,
        suggestedAction: 'Add more ETH to your wallet to cover gas fees'
      };
    }
    
    return null;
  }

  static getNetworkCongestionWarning(gasPrice: bigint, averageGasPrice: bigint): BlockchainError | null {
    const threshold = averageGasPrice * BigInt(150) / BigInt(100); // 50% above average
    
    if (gasPrice > threshold) {
      return {
        code: 'NETWORK_CONGESTION',
        message: 'High gas prices detected',
        userMessage: 'Network is congested - transaction fees are higher than usual',
        severity: 'medium',
        actionable: true,
        suggestedAction: 'Consider waiting for lower gas prices or increase gas limit for faster processing'
      };
    }
    
    return null;
  }
}

export default ErrorHandler;