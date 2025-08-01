import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class GovernanceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Governance Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log error for monitoring (in production, send to error tracking service)
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to error tracking service like Sentry
    console.group('🚨 Governance Error Details');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Boundary:', 'GovernanceErrorBoundary');
    console.groupEnd();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center bg-background">
          <div className="max-w-md mx-auto text-center p-6">
            <div className="text-red-500 mb-6">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-white mb-4">
              Governance System Error
            </h2>
            
            <p className="text-text-secondary mb-6">
              Something went wrong with the governance system. This might be due to a network issue, 
              smart contract problem, or temporary service disruption.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-red-400 font-medium mb-2">Error Details (Development)</h3>
                <pre className="text-xs text-red-300 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="bg-card hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 border border-gray-600"
              >
                Reload Page
              </button>
            </div>

            <div className="mt-6 text-sm text-text-secondary">
              <p>If the problem persists, please:</p>
              <ul className="mt-2 space-y-1">
                <li>• Check your wallet connection</li>
                <li>• Ensure you're on the correct network</li>
                <li>• Try refreshing the page</li>
                <li>• Contact support if issues continue</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}