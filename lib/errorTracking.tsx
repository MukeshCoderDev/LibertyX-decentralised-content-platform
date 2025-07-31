import React from 'react';
import { monitoring } from './monitoring';
import { getCurrentEnvironment } from '../config/environments';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  chainId?: number;
  txHash?: string;
  url?: string;
  userAgent?: string;
  timestamp?: number;
  additionalData?: any;
}

export interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  reportedAt: number;
  resolvedAt?: number;
}

class ErrorTrackingService {
  private environment = getCurrentEnvironment();
  private errorReports: Map<string, ErrorReport> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private rateLimitMap: Map<string, number> = new Map();

  constructor() {
    this.setupGlobalErrorHandlers();
    this.setupUnhandledRejectionHandler();
    this.startErrorReportCleanup();
  }

  private setupGlobalErrorHandlers() {
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        component: 'global',
        action: 'javascript_error',
        url: event.filename,
        additionalData: {
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          component: 'global',
          action: 'unhandled_promise_rejection',
          additionalData: {
            reason: event.reason,
          },
        }
      );
    });
  }

  private setupUnhandledRejectionHandler() {
    // Additional promise rejection handling
    if (typeof process !== 'undefined' && process.on) {
      process.on('unhandledRejection', (reason, promise) => {
        this.trackError(
          new Error(`Node.js Unhandled Promise Rejection: ${reason}`),
          {
            component: 'nodejs',
            action: 'unhandled_promise_rejection',
            additionalData: {
              reason,
              promise: promise.toString(),
            },
          }
        );
      });
    }
  }

  public trackError(
    error: Error,
    context: ErrorContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): string {
    const errorId = this.generateErrorId(error, context);
    
    // Rate limiting to prevent spam
    if (this.isRateLimited(errorId)) {
      return errorId;
    }

    // Enhanced context
    const enhancedContext: ErrorContext = {
      ...context,
      url: context.url || window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };

    const errorReport: ErrorReport = {
      id: errorId,
      error,
      context: enhancedContext,
      severity,
      resolved: false,
      reportedAt: Date.now(),
    };

    this.errorReports.set(errorId, errorReport);
    this.incrementErrorCount(errorId);

    // Send to monitoring service
    monitoring.trackError({
      error,
      context: enhancedContext,
    });

    // Log to console in development
    if (this.environment.name === 'Development') {
      console.error('🚨 Error Tracked:', {
        id: errorId,
        message: error.message,
        context: enhancedContext,
        severity,
      });
    }

    // Send critical errors immediately
    if (severity === 'critical') {
      this.sendCriticalErrorAlert(errorReport);
    }

    return errorId;
  }

  public trackBlockchainError(
    error: Error,
    chainId: number,
    txHash?: string,
    operation?: string
  ): string {
    return this.trackError(error, {
      component: 'blockchain',
      action: operation || 'blockchain_operation',
      chainId,
      txHash,
    }, this.getBlockchainErrorSeverity(error));
  }

  public trackWalletError(
    error: Error,
    walletType: string,
    operation: string
  ): string {
    return this.trackError(error, {
      component: 'wallet',
      action: operation,
      additionalData: { walletType },
    }, 'high');
  }

  public trackArweaveError(
    error: Error,
    operation: string,
    fileSize?: number
  ): string {
    return this.trackError(error, {
      component: 'arweave',
      action: operation,
      additionalData: { fileSize },
    }, 'medium');
  }

  public trackAPIError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number
  ): string {
    return this.trackError(error, {
      component: 'api',
      action: 'api_request',
      additionalData: {
        endpoint,
        method,
        statusCode,
      },
    }, statusCode && statusCode >= 500 ? 'high' : 'medium');
  }

  public resolveError(errorId: string): boolean {
    const errorReport = this.errorReports.get(errorId);
    if (errorReport && !errorReport.resolved) {
      errorReport.resolved = true;
      errorReport.resolvedAt = Date.now();
      
      monitoring.trackEvent({
        type: 'info',
        category: 'error_resolution',
        message: 'Error resolved',
        data: {
          errorId,
          resolutionTime: errorReport.resolvedAt - errorReport.reportedAt,
        },
      });
      
      return true;
    }
    return false;
  }

  public getErrorReport(errorId: string): ErrorReport | undefined {
    return this.errorReports.get(errorId);
  }

  public getErrorReports(filters?: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    component?: string;
    resolved?: boolean;
    since?: number;
  }): ErrorReport[] {
    let reports = Array.from(this.errorReports.values());

    if (filters) {
      if (filters.severity) {
        reports = reports.filter(r => r.severity === filters.severity);
      }
      if (filters.component) {
        reports = reports.filter(r => r.context.component === filters.component);
      }
      if (filters.resolved !== undefined) {
        reports = reports.filter(r => r.resolved === filters.resolved);
      }
      if (filters.since) {
        reports = reports.filter(r => r.reportedAt >= filters.since);
      }
    }

    return reports.sort((a, b) => b.reportedAt - a.reportedAt);
  }

  public getErrorStats(): {
    total: number;
    resolved: number;
    unresolved: number;
    bySeverity: { [key: string]: number };
    byComponent: { [key: string]: number };
    topErrors: { errorId: string; count: number; message: string }[];
  } {
    const reports = Array.from(this.errorReports.values());
    
    const stats = {
      total: reports.length,
      resolved: reports.filter(r => r.resolved).length,
      unresolved: reports.filter(r => !r.resolved).length,
      bySeverity: {} as { [key: string]: number },
      byComponent: {} as { [key: string]: number },
      topErrors: [] as { errorId: string; count: number; message: string }[],
    };

    // Count by severity
    reports.forEach(report => {
      stats.bySeverity[report.severity] = (stats.bySeverity[report.severity] || 0) + 1;
    });

    // Count by component
    reports.forEach(report => {
      const component = report.context.component || 'unknown';
      stats.byComponent[component] = (stats.byComponent[component] || 0) + 1;
    });

    // Top errors by count
    const errorCountEntries = Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    stats.topErrors = errorCountEntries.map(([errorId, count]) => {
      const report = this.errorReports.get(errorId);
      return {
        errorId,
        count,
        message: report?.error.message || 'Unknown error',
      };
    });

    return stats;
  }

  private generateErrorId(error: Error, context: ErrorContext): string {
    const contextString = JSON.stringify({
      component: context.component,
      action: context.action,
      message: error.message,
      stack: error.stack?.split('\n')[0], // First line of stack trace
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < contextString.length; i++) {
      const char = contextString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `error_${Math.abs(hash).toString(36)}`;
  }

  private isRateLimited(errorId: string): boolean {
    const now = Date.now();
    const lastReported = this.rateLimitMap.get(errorId) || 0;
    const rateLimitWindow = 60000; // 1 minute

    if (now - lastReported < rateLimitWindow) {
      return true;
    }

    this.rateLimitMap.set(errorId, now);
    return false;
  }

  private incrementErrorCount(errorId: string) {
    const currentCount = this.errorCounts.get(errorId) || 0;
    this.errorCounts.set(errorId, currentCount + 1);
  }

  private getBlockchainErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    
    if (message.includes('insufficient funds') || message.includes('gas')) {
      return 'medium';
    }
    if (message.includes('rejected') || message.includes('cancelled')) {
      return 'low';
    }
    if (message.includes('network') || message.includes('connection')) {
      return 'high';
    }
    if (message.includes('contract') || message.includes('revert')) {
      return 'critical';
    }
    
    return 'medium';
  }

  private async sendCriticalErrorAlert(errorReport: ErrorReport) {
    // In a real implementation, this would send alerts via email, Slack, etc.
    console.error('🚨 CRITICAL ERROR ALERT:', {
      id: errorReport.id,
      message: errorReport.error.message,
      context: errorReport.context,
    });

    // Send to monitoring service with high priority
    monitoring.trackEvent({
      type: 'error',
      category: 'critical_alert',
      message: `Critical error: ${errorReport.error.message}`,
      data: {
        errorId: errorReport.id,
        context: errorReport.context,
      },
    });
  }

  private startErrorReportCleanup() {
    // Clean up old error reports every hour
    setInterval(() => {
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      
      for (const [errorId, report] of this.errorReports.entries()) {
        if (report.reportedAt < cutoffTime && report.resolved) {
          this.errorReports.delete(errorId);
        }
      }
      
      // Clean up rate limit map
      const rateLimitCutoff = Date.now() - (60 * 60 * 1000); // 1 hour ago
      for (const [errorId, timestamp] of this.rateLimitMap.entries()) {
        if (timestamp < rateLimitCutoff) {
          this.rateLimitMap.delete(errorId);
        }
      }
    }, 60 * 60 * 1000); // Every hour
  }
}

// Global error tracking instance
export const errorTracking = new ErrorTrackingService();

// React Error Boundary helper
export const createErrorBoundary = (componentName: string) => {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; errorId?: string }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      const errorId = errorTracking.trackError(error, {
        component: componentName,
        action: 'react_error_boundary',
        additionalData: errorInfo,
      }, 'high');
      
      this.setState({ errorId });
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🚨</div>
              <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
              <p className="text-gray-400 mb-4">
                An error occurred in the {componentName} component.
              </p>
              {this.state.errorId && (
                <p className="text-sm text-gray-500 mb-4">
                  Error ID: {this.state.errorId}
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        );
      }

      return this.props.children;
    }
  };
};

// Async operation wrapper with error tracking
export const withErrorTracking = async <T,>(
  operation: () => Promise<T>,
  context: ErrorContext,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    errorTracking.trackError(error as Error, context, severity);
    throw error;
  }
};