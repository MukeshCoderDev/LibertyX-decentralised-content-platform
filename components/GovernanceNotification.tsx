import React, { useEffect, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface GovernanceNotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const GovernanceNotification: React.FC<GovernanceNotificationProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const getNotificationStyles = () => {
    const baseStyles = "border rounded-lg p-4 shadow-lg";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-900/20 border-green-500/30 text-green-100`;
      case 'error':
        return `${baseStyles} bg-red-900/20 border-red-500/30 text-red-100`;
      case 'warning':
        return `${baseStyles} bg-yellow-900/20 border-yellow-500/30 text-yellow-100`;
      case 'info':
        return `${baseStyles} bg-blue-900/20 border-blue-500/30 text-blue-100`;
      default:
        return `${baseStyles} bg-gray-900/20 border-gray-500/30 text-gray-100`;
    }
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    
    switch (type) {
      case 'success':
        return (
          <svg className={`${iconClass} text-green-400`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`${iconClass} text-red-400`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`${iconClass} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className={`${iconClass} text-blue-400`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div
        className={`
          ${getNotificationStyles()}
          transform transition-all duration-300 ease-in-out
          ${isAnimating 
            ? 'translate-x-0 opacity-100 scale-100' 
            : 'translate-x-full opacity-0 scale-95'
          }
        `}
      >
        <div className="flex items-start space-x-3">
          {getIcon()}
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-sm opacity-90 mt-1">{message}</p>
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity duration-200"
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing notifications
export const useGovernanceNotifications = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    isVisible: boolean;
  }>>([]);

  const showNotification = (type: NotificationType, title: string, message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, title, message, isVisible: true }]);
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isVisible: false }
          : notification
      )
    );
    
    // Remove from array after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 300);
  };

  const showSuccess = (title: string, message: string) => showNotification('success', title, message);
  const showError = (title: string, message: string) => showNotification('error', title, message);
  const showWarning = (title: string, message: string) => showNotification('warning', title, message);
  const showInfo = (title: string, message: string) => showNotification('info', title, message);

  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <GovernanceNotification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </div>
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    NotificationContainer,
  };
};