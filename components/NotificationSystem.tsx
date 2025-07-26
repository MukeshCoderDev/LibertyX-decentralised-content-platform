import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import XMarkIcon from './icons/XMarkIcon';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 for persistent
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      id,
      duration: 5000, // default 5 seconds
      dismissible: true,
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration (if not persistent)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onRemove: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
    }
  };

  return (
    <div className={`rounded-lg border p-4 shadow-lg ${getBackgroundColor()} ${getTextColor()} animate-slide-in-right`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium">
            {notification.title}
          </h4>
          <p className="text-sm mt-1 opacity-90">
            {notification.message}
          </p>
          
          {notification.actionLabel && notification.onAction && (
            <button
              onClick={notification.onAction}
              className="mt-2 text-xs font-medium underline hover:no-underline transition-all"
            >
              {notification.actionLabel}
            </button>
          )}
        </div>
        
        {notification.dismissible && (
          <button
            onClick={onRemove}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Utility hooks for common notification types
export const useTransactionNotifications = () => {
  const { addNotification } = useNotifications();

  const notifyTransactionStarted = useCallback((hash: string) => {
    return addNotification({
      type: 'info',
      title: 'Transaction Submitted',
      message: 'Your transaction has been submitted to the blockchain',
      duration: 3000,
      actionLabel: 'View on Explorer',
      onAction: () => window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank')
    });
  }, [addNotification]);

  const notifyTransactionSuccess = useCallback((message: string, hash?: string) => {
    return addNotification({
      type: 'success',
      title: 'Transaction Successful',
      message,
      duration: 5000,
      ...(hash && {
        actionLabel: 'View on Explorer',
        onAction: () => window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank')
      })
    });
  }, [addNotification]);

  const notifyTransactionError = useCallback((error: string, canRetry: boolean = false, onRetry?: () => void) => {
    return addNotification({
      type: 'error',
      title: 'Transaction Failed',
      message: error,
      duration: 0, // Persistent for errors
      ...(canRetry && onRetry && {
        actionLabel: 'Try Again',
        onAction: onRetry
      })
    });
  }, [addNotification]);

  const notifyInsufficientFunds = useCallback((requiredAmount: string, tokenSymbol: string) => {
    return addNotification({
      type: 'warning',
      title: 'Insufficient Funds',
      message: `You need at least ${requiredAmount} ${tokenSymbol} to complete this transaction`,
      duration: 0,
      actionLabel: 'Add Funds',
      onAction: () => {
        // Could open a modal or redirect to a funding page
        console.log('Redirect to funding page');
      }
    });
  }, [addNotification]);

  const notifyNetworkCongestion = useCallback((estimatedWaitTime?: string) => {
    return addNotification({
      type: 'warning',
      title: 'Network Congestion',
      message: `High network traffic detected. ${estimatedWaitTime ? `Estimated wait time: ${estimatedWaitTime}` : 'Transactions may take longer than usual.'}`,
      duration: 8000
    });
  }, [addNotification]);

  const notifyGasEstimationFailed = useCallback((onRetryWithHigherGas?: () => void) => {
    return addNotification({
      type: 'warning',
      title: 'Gas Estimation Failed',
      message: 'Unable to estimate gas for this transaction. It may fail or require higher gas limits.',
      duration: 0,
      ...(onRetryWithHigherGas && {
        actionLabel: 'Retry with Higher Gas',
        onAction: onRetryWithHigherGas
      })
    });
  }, [addNotification]);

  return {
    notifyTransactionStarted,
    notifyTransactionSuccess,
    notifyTransactionError,
    notifyInsufficientFunds,
    notifyNetworkCongestion,
    notifyGasEstimationFailed
  };
};

export default NotificationProvider;