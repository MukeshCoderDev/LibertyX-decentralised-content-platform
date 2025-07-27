import React from 'react';

export interface NetworkBadgeProps {
  networkName: string;
  isConnected: boolean;
  isConnecting?: boolean;
  size?: 'small' | 'medium' | 'large';
  showNetworkName?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

/**
 * Clean network status badge component that replaces bullet separator with green dot
 * Provides consistent styling and clear connection status indication
 */
export const NetworkBadge: React.FC<NetworkBadgeProps> = ({
  networkName,
  isConnected,
  isConnecting = false,
  size = 'medium',
  showNetworkName = true,
  className = '',
  variant = 'default',
}) => {
  // Size-based styling
  const sizeClasses = {
    small: {
      text: 'text-xs',
      padding: 'px-2 py-1',
      dot: 'w-1.5 h-1.5',
      gap: 'gap-1.5',
    },
    medium: {
      text: 'text-xs',
      padding: 'px-2 py-1',
      dot: 'w-2 h-2',
      gap: 'gap-2',
    },
    large: {
      text: 'text-sm',
      padding: 'px-3 py-1.5',
      dot: 'w-2.5 h-2.5',
      gap: 'gap-2',
    },
  };

  // Get connection status styling
  const getConnectionStatus = () => {
    if (isConnecting) {
      return {
        dotColor: 'bg-yellow-500',
        bgColor: 'bg-yellow-900/30',
        textColor: 'text-yellow-400',
        borderColor: 'border-yellow-700/50',
        statusText: 'Connecting',
        pulseAnimation: 'animate-pulse',
      };
    }

    if (isConnected) {
      return {
        dotColor: 'bg-green-500',
        bgColor: 'bg-green-900/30',
        textColor: 'text-green-400',
        borderColor: 'border-green-700/50',
        statusText: 'Connected',
        pulseAnimation: '',
      };
    }

    return {
      dotColor: 'bg-red-500',
      bgColor: 'bg-red-900/30',
      textColor: 'text-red-400',
      borderColor: 'border-red-700/50',
      statusText: 'Disconnected',
      pulseAnimation: '',
    };
  };

  const status = getConnectionStatus();
  const sizeClass = sizeClasses[size];

  // Variant-specific rendering
  if (variant === 'minimal') {
    return (
      <div
        className={`inline-flex items-center ${sizeClass.gap} ${className}`}
        role="status"
        aria-label={`Network ${status.statusText.toLowerCase()}`}
      >
        <div
          className={`
            ${sizeClass.dot} rounded-full ${status.dotColor} ${status.pulseAnimation}
          `}
          aria-hidden="true"
        />
        {showNetworkName && (
          <span className={`${sizeClass.text} ${status.textColor} font-medium`}>
            {networkName}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`
          inline-flex items-center ${sizeClass.gap} ${sizeClass.padding} rounded-md
          ${status.bgColor} ${status.borderColor} border ${className}
        `}
        role="status"
        aria-label={`${networkName} network ${status.statusText.toLowerCase()}`}
      >
        <div
          className={`
            ${sizeClass.dot} rounded-full ${status.dotColor} ${status.pulseAnimation}
          `}
          aria-hidden="true"
        />
        {showNetworkName && (
          <span className={`${sizeClass.text} ${status.textColor} font-medium`}>
            {networkName}
          </span>
        )}
      </div>
    );
  }

  // Default variant - full badge with status text
  return (
    <div
      className={`
        inline-flex items-center ${sizeClass.gap} ${sizeClass.padding} rounded-md font-medium
        ${status.bgColor} ${status.textColor} border ${status.borderColor} ${className}
      `}
      role="status"
      aria-label={`${networkName} network ${status.statusText.toLowerCase()}`}
    >
      <div
        className={`
          ${sizeClass.dot} rounded-full ${status.dotColor} ${status.pulseAnimation}
        `}
        aria-hidden="true"
      />
      <span className={sizeClass.text}>
        {showNetworkName ? `${networkName} • ${status.statusText}` : status.statusText}
      </span>
    </div>
  );
};

/**
 * Simple network dot indicator without text
 */
export const NetworkDot: React.FC<{
  isConnected: boolean;
  isConnecting?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({ isConnected, isConnecting = false, size = 'medium', className = '' }) => {
  const dotSizes = {
    small: 'w-1.5 h-1.5',
    medium: 'w-2 h-2',
    large: 'w-2.5 h-2.5',
  };

  const getStatusColor = () => {
    if (isConnecting) return 'bg-yellow-500 animate-pulse';
    if (isConnected) return 'bg-green-500';
    return 'bg-red-500';
  };

  return (
    <div
      className={`${dotSizes[size]} rounded-full ${getStatusColor()} ${className}`}
      role="status"
      aria-label={isConnecting ? 'Connecting' : isConnected ? 'Connected' : 'Disconnected'}
    />
  );
};

/**
 * Network status with clean separator (replaces bullet "·")
 */
export const NetworkStatus: React.FC<{
  networkName: string;
  isConnected: boolean;
  isConnecting?: boolean;
  className?: string;
}> = ({ networkName, isConnected, isConnecting = false, className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-text-secondary">Network:</span>
      <span className="text-primary font-medium">{networkName}</span>
      <NetworkDot
        isConnected={isConnected}
        isConnecting={isConnecting}
        size="small"
      />
      <span className={`text-xs font-medium ${
        isConnecting ? 'text-yellow-400' : 
        isConnected ? 'text-green-400' : 'text-red-400'
      }`}>
        {isConnecting ? 'Connecting' : isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
};

/**
 * Hook to get network status styling
 */
export const useNetworkStatus = (isConnected: boolean, isConnecting: boolean = false) => {
  const getStatusClasses = () => {
    if (isConnecting) {
      return {
        dotColor: 'bg-yellow-500 animate-pulse',
        textColor: 'text-yellow-400',
        bgColor: 'bg-yellow-900/30',
        borderColor: 'border-yellow-700/50',
        statusText: 'Connecting',
      };
    }

    if (isConnected) {
      return {
        dotColor: 'bg-green-500',
        textColor: 'text-green-400',
        bgColor: 'bg-green-900/30',
        borderColor: 'border-green-700/50',
        statusText: 'Connected',
      };
    }

    return {
      dotColor: 'bg-red-500',
      textColor: 'text-red-400',
      bgColor: 'bg-red-900/30',
      borderColor: 'border-red-700/50',
      statusText: 'Disconnected',
    };
  };

  return getStatusClasses();
};

export default NetworkBadge;