import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '24px',
          backgroundColor: 'var(--background-secondary, #1f2937)',
          border: '1px solid #dc2626',
          borderRadius: '8px',
          margin: '16px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
            ⚠️ Something went wrong
          </h2>
          <p style={{ color: 'var(--text-secondary, #888)', marginBottom: '16px' }}>
            An error occurred while rendering this component.
          </p>
          <details style={{ textAlign: 'left', marginBottom: '16px' }}>
            <summary style={{ color: 'var(--text-primary, #fff)', cursor: 'pointer', marginBottom: '8px' }}>
              Error Details
            </summary>
            <pre style={{
              backgroundColor: 'var(--background, #111827)',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#dc2626',
              overflow: 'auto'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{
              backgroundColor: 'var(--primary, #007bff)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;