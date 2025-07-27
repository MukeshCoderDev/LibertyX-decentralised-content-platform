import React from 'react';

export interface LockBadgeProps {
  tier?: number;
  accessType: 'subscription' | 'nft' | 'premium';
  hasAccess?: boolean;
  isLoading?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showIcon?: boolean;
}

/**
 * Unified access control badge component that replaces inconsistent access labels
 * Provides consistent styling and messaging for content access requirements
 */
export const LockBadge: React.FC<LockBadgeProps> = ({
  tier,
  accessType,
  hasAccess = false,
  isLoading = false,
  size = 'medium',
  className = '',
  showIcon = true,
}) => {
  // Size-based styling
  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-xs px-3 py-1.5',
    large: 'text-sm px-4 py-2',
  };

  // Get badge content based on access type and state
  const getBadgeContent = () => {
    if (isLoading) {
      return {
        text: '...',
        icon: '⏳',
        bgColor: 'bg-gray-500',
        textColor: 'text-white',
      };
    }

    if (hasAccess) {
      switch (accessType) {
        case 'subscription':
          return {
            text: 'Subscribed',
            icon: '✓',
            bgColor: 'bg-green-500',
            textColor: 'text-white',
          };
        case 'nft':
          return {
            text: `NFT Tier #${tier || 1}`,
            icon: '✓',
            bgColor: 'bg-purple-500',
            textColor: 'text-white',
          };
        case 'premium':
          return {
            text: 'Premium Access',
            icon: '✓',
            bgColor: 'bg-gradient-to-r from-yellow-400 to-orange-500',
            textColor: 'text-white',
          };
        default:
          return {
            text: 'Access Granted',
            icon: '✓',
            bgColor: 'bg-green-500',
            textColor: 'text-white',
          };
      }
    } else {
      // No access - show requirement
      switch (accessType) {
        case 'subscription':
          return {
            text: 'Subscribe Required',
            icon: '🔒',
            bgColor: 'bg-orange-500',
            textColor: 'text-white',
          };
        case 'nft':
          return {
            text: `Need NFT Tier #${tier || 1}`,
            icon: '🎨',
            bgColor: 'bg-orange-500',
            textColor: 'text-white',
          };
        case 'premium':
          return {
            text: 'Premium Required',
            icon: '💎',
            bgColor: 'bg-orange-500',
            textColor: 'text-white',
          };
        default:
          return {
            text: 'Access Required',
            icon: '🔒',
            bgColor: 'bg-orange-500',
            textColor: 'text-white',
          };
      }
    }
  };

  const badgeContent = getBadgeContent();
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 font-bold rounded-full
        ${badgeContent.bgColor} ${badgeContent.textColor} ${sizeClass}
        transition-all duration-200 hover:scale-105
        ${className}
      `}
      role="status"
      aria-label={`${accessType} access ${hasAccess ? 'granted' : 'required'}`}
    >
      {showIcon && (
        <span className="text-current" aria-hidden="true">
          {badgeContent.icon}
        </span>
      )}
      <span className="font-satoshi font-bold whitespace-nowrap">
        {badgeContent.text}
      </span>
    </div>
  );
};

/**
 * Simplified LockBadge for text-only contexts (like under creator names)
 */
export const LockBadgeText: React.FC<Omit<LockBadgeProps, 'showIcon'>> = (props) => {
  const { accessType, hasAccess, tier } = props;

  if (hasAccess) {
    return null; // Don't show anything if user has access
  }

  // Get simplified text based on access type
  const getText = () => {
    switch (accessType) {
      case 'subscription':
        return 'Subscription required';
      case 'nft':
        return `NFT Tier #${tier || 1} required`;
      case 'premium':
        return 'Premium access required';
      default:
        return 'Access required';
    }
  };

  // Get color based on access type
  const getColorClass = () => {
    switch (accessType) {
      case 'subscription':
        return 'text-orange-300';
      case 'nft':
        return 'text-purple-300';
      case 'premium':
        return 'text-yellow-300';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <p className={`text-xs ${getColorClass()}`}>
      {getText()}
    </p>
  );
};

/**
 * Hook to get standardized access requirement text
 */
export const useAccessRequirementText = (
  accessType: 'subscription' | 'nft' | 'premium',
  tier?: number
) => {
  const getRequirementText = () => {
    switch (accessType) {
      case 'subscription':
        return 'Subscribe to access this content';
      case 'nft':
        return `Own NFT Tier #${tier || 1} to access this content`;
      case 'premium':
        return 'Premium subscription or NFT required to access this content';
      default:
        return 'Special access required for this content';
    }
  };

  const getShortText = () => {
    switch (accessType) {
      case 'subscription':
        return 'Subscription required';
      case 'nft':
        return `Need NFT Tier #${tier || 1}`;
      case 'premium':
        return 'Premium required';
      default:
        return 'Access required';
    }
  };

  return {
    fullText: getRequirementText(),
    shortText: getShortText(),
  };
};

export default LockBadge;