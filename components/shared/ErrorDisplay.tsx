import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  showRetry = true 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-xl">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
      <p className="text-red-600 text-center mb-4">{error}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};