import React, { useState, useEffect } from 'react';
import Button from './ui/Button';

export interface FeedbackMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  txHash?: string;
  duration?: number; // Auto-dismiss after this many ms
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

interface UserFeedbackProps {
  message: FeedbackMessage;
  onDismiss: (id: string) => void;
}

const UserFeedback: React.FC<UserFeedbackProps> = ({ message, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (message.duration) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, message.duration);

      return () => clearTimeout(timer);
    }
  }, [message.duration]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(message.id), 300); // Allow fade out animation
  };

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getColorClasses = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      default:
        return 'bg-border/10 border-border/20 text-text-primary';
    }
  };

  const openEtherscan = () => {
    if (message.txHash) {
      const baseUrl = 'https://sepolia.etherscan.io/tx/';
      window.open(`${baseUrl}${message.txHash}`, '_blank');
    }
  };

  return (
    <div
      className={`
        ${getColorClasses()}
        border rounded-lg p-4 mb-4 transition-all duration-300
        ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <span className="text-lg">{getIcon()}</span>
          <div className="flex-1">
            <h4 className="font-semibold mb-1">{message.title}</h4>
            <p className="text-sm opacity-90">{message.message}</p>
            
            {message.txHash && (
              <div className="mt-2">
                <button
                  onClick={openEtherscan}
                  className="text-xs underline hover:no-underline opacity-75 hover:opacity-100"
                >
                  View on Etherscan: {message.txHash.slice(0, 10)}...{message.txHash.slice(-8)}
                </button>
              </div>
            )}

            {message.actions && message.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {message.actions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    variant={action.variant || 'secondary'}
                    size="sm"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-current opacity-50 hover:opacity-100 ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Feedback Manager Hook
export const useFeedback = () => {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);

  const addMessage = (message: Omit<FeedbackMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newMessage: FeedbackMessage = {
      ...message,
      id,
      duration: message.duration || (message.type === 'success' ? 5000 : undefined)
    };
    
    setMessages(prev => [...prev, newMessage]);
    return id;
  };

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const clearAll = () => {
    setMessages([]);
  };

  // Convenience methods
  const showSuccess = (title: string, message: string, txHash?: string) => {
    return addMessage({
      type: 'success',
      title,
      message,
      txHash,
      duration: 8000
    });
  };

  const showError = (title: string, message: string, actions?: FeedbackMessage['actions']) => {
    return addMessage({
      type: 'error',
      title,
      message,
      actions
    });
  };

  const showWarning = (title: string, message: string, duration?: number) => {
    return addMessage({
      type: 'warning',
      title,
      message,
      duration: duration || 6000
    });
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    return addMessage({
      type: 'info',
      title,
      message,
      duration: duration || 5000
    });
  };

  return {
    messages,
    addMessage,
    removeMessage,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// Feedback Container Component
export const FeedbackContainer: React.FC = () => {
  const { messages, removeMessage } = useFeedback();

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-2">
      {messages.map(message => (
        <UserFeedback
          key={message.id}
          message={message}
          onDismiss={removeMessage}
        />
      ))}
    </div>
  );
};

export default UserFeedback;