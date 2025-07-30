import React, { forwardRef } from 'react';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'medium', 
    isLoading = false, 
    loadingText = 'Loading...', 
    children, 
    disabled,
    className = '',
    ...props 
  }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return 'bg-primary hover:bg-primary-dark text-white disabled:bg-primary/50';
        case 'secondary':
          return 'bg-card hover:bg-gray-700 text-white border border-gray-600 disabled:bg-card/50';
        case 'success':
          return 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-600/50';
        case 'danger':
          return 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-600/50';
        case 'warning':
          return 'bg-yellow-600 hover:bg-yellow-700 text-white disabled:bg-yellow-600/50';
        default:
          return 'bg-primary hover:bg-primary-dark text-white disabled:bg-primary/50';
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case 'small':
          return 'px-3 py-1.5 text-sm';
        case 'medium':
          return 'px-4 py-2 text-sm';
        case 'large':
          return 'px-6 py-3 text-base';
        default:
          return 'px-4 py-2 text-sm';
      }
    };

    const baseStyles = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed';
    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg 
              className="animate-spin -ml-1 mr-2 h-4 w-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="sr-only">Loading</span>
            {loadingText}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';