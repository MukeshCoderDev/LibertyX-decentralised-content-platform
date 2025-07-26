import React from 'react';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';

export interface TransactionState {
  status: 'idle' | 'pending' | 'success' | 'error';
  hash?: string;
  confirmations?: number;
  requiredConfirmations?: number;
  error?: string;
  message?: string;
}

interface TransactionFeedbackProps {
  transaction: TransactionState;
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
}

export const TransactionFeedback: React.FC<TransactionFeedbackProps> = ({
  transaction,
  onRetry,
  onClose,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'pending':
        return (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        );
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'pending':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusMessage = () => {
    switch (transaction.status) {
      case 'pending':
        if (transaction.confirmations && transaction.requiredConfirmations) {
          return `Confirming transaction... ${transaction.confirmations}/${transaction.requiredConfirmations} confirmations`;
        }
        return 'Transaction pending...';
      case 'success':
        return transaction.message || 'Transaction completed successfully!';
      case 'error':
        return transaction.error || 'Transaction failed';
      default:
        return transaction.message || '';
    }
  };

  const truncateHash = (hash: string) => {
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  if (transaction.status === 'idle') return null;

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {getStatusMessage()}
            </p>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {transaction.hash && (
            <div className="mt-2">
              <p className="text-xs text-gray-600">
                Transaction Hash:
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <code className="text-xs bg-white/50 px-2 py-1 rounded font-mono">
                  {truncateHash(transaction.hash)}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(transaction.hash!)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Copy
                </button>
                <a
                  href={`https://sepolia.etherscan.io/tx/${transaction.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  View on Explorer
                </a>
              </div>
            </div>
          )}
          
          {transaction.status === 'pending' && transaction.confirmations !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Confirmations</span>
                <span>{transaction.confirmations}/{transaction.requiredConfirmations || 12}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (transaction.confirmations / (transaction.requiredConfirmations || 12)) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          )}
          
          {transaction.status === 'error' && onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};