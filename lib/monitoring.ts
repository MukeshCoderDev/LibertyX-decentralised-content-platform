import { getCurrentEnvironment } from '../config/environments';

export interface MonitoringEvent {
  type: 'error' | 'warning' | 'info' | 'performance' | 'user_action';
  category: string;
  message: string;
  data?: any;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  chainId?: number;
  txHash?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: { [key: string]: string };
}

export interface ErrorReport {
  error: Error;
  context: {
    component?: string;
    action?: string;
    userId?: string;
    chainId?: number;
    txHash?: string;
    additionalData?: any;
  };
}

class MonitoringService {
  private environment = getCurrentEnvironment();
  private sessionId: string;
  private userId?: string;
  private eventQueue: MonitoringEvent[] = [];
  private metricsQueue: PerformanceMetric[] = [];
  private isOnline = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupNetworkMonitoring();
    this.setupPerformanceMonitoring();
    this.startBatchSending();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public trackEvent(event: Omit<MonitoringEvent, 'timestamp' | 'sessionId' | 'userId'>) {
    const fullEvent: MonitoringEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.eventQueue.push(fullEvent);

    // Log to console in development
    if (this.environment.name === 'Development') {
      console.log('📊 Monitoring Event:', fullEvent);
    }

    // Send critical errors immediately
    if (event.type === 'error') {
      this.sendImmediately([fullEvent]);
    }
  }

  public trackError(errorReport: ErrorReport) {
    const event: MonitoringEvent = {
      type: 'error',
      category: 'application_error',
      message: errorReport.error.message,
      data: {
        stack: errorReport.error.stack,
        name: errorReport.error.name,
        context: errorReport.context,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      chainId: errorReport.context.chainId,
      txHash: errorReport.context.txHash,
    };

    this.trackEvent(event);
  }

  public trackPerformance(metric: Omit<PerformanceMetric, 'timestamp'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metricsQueue.push(fullMetric);

    // Log performance issues
    if (metric.name === 'page_load_time' && metric.value > 3000) {
      this.trackEvent({
        type: 'warning',
        category: 'performance',
        message: 'Slow page load detected',
        data: { loadTime: metric.value },
      });
    }
  }

  public trackUserAction(action: string, data?: any) {
    this.trackEvent({
      type: 'user_action',
      category: 'user_interaction',
      message: action,
      data,
    });
  }

  public trackBlockchainOperation(operation: string, chainId: number, txHash?: string, data?: any) {
    this.trackEvent({
      type: 'info',
      category: 'blockchain',
      message: operation,
      data,
      chainId,
      txHash,
    });
  }

  private setupNetworkMonitoring() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.trackEvent({
        type: 'info',
        category: 'network',
        message: 'Connection restored',
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.trackEvent({
        type: 'warning',
        category: 'network',
        message: 'Connection lost',
      });
    });
  }

  private setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.trackPerformance({
        name: 'page_load_time',
        value: navigation.loadEventEnd - navigation.fetchStart,
        unit: 'ms',
      });

      this.trackPerformance({
        name: 'dom_content_loaded',
        value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        unit: 'ms',
      });
    });

    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Track slow resources
          if (resourceEntry.duration > 2000) {
            this.trackEvent({
              type: 'warning',
              category: 'performance',
              message: 'Slow resource loading',
              data: {
                resource: resourceEntry.name,
                duration: resourceEntry.duration,
              },
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private startBatchSending() {
    // Send events and metrics every 30 seconds
    setInterval(() => {
      this.sendBatch();
    }, 30000);

    // Send on page unload
    window.addEventListener('beforeunload', () => {
      this.sendBatch();
    });
  }

  private async sendBatch() {
    if (!this.environment.monitoring.enabled || (!this.eventQueue.length && !this.metricsQueue.length)) {
      return;
    }

    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      environment: this.environment.name,
      events: [...this.eventQueue],
      metrics: [...this.metricsQueue],
      timestamp: Date.now(),
    };

    try {
      await this.sendToMonitoringService(payload);
      this.eventQueue = [];
      this.metricsQueue = [];
    } catch (error) {
      console.error('Failed to send monitoring data:', error);
    }
  }

  private async sendImmediately(events: MonitoringEvent[]) {
    if (!this.environment.monitoring.enabled) {
      return;
    }

    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      environment: this.environment.name,
      events,
      metrics: [],
      timestamp: Date.now(),
      urgent: true,
    };

    try {
      await this.sendToMonitoringService(payload);
    } catch (error) {
      console.error('Failed to send urgent monitoring data:', error);
    }
  }

  private async sendToMonitoringService(payload: any) {
    if (!this.environment.monitoring.endpoint) {
      return;
    }

    const response = await fetch(this.environment.monitoring.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.environment.monitoring.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Monitoring service responded with ${response.status}`);
    }
  }

  // Public methods for specific tracking scenarios
  public trackWalletConnection(walletType: string, success: boolean, error?: string) {
    this.trackEvent({
      type: success ? 'info' : 'error',
      category: 'wallet',
      message: `Wallet connection ${success ? 'successful' : 'failed'}`,
      data: { walletType, error },
    });
  }

  public trackTransactionStart(txType: string, chainId: number) {
    this.trackEvent({
      type: 'info',
      category: 'transaction',
      message: 'Transaction initiated',
      data: { txType },
      chainId,
    });
  }

  public trackTransactionComplete(txType: string, chainId: number, txHash: string, gasUsed?: number) {
    this.trackEvent({
      type: 'info',
      category: 'transaction',
      message: 'Transaction completed',
      data: { txType, gasUsed },
      chainId,
      txHash,
    });
  }

  public trackTransactionFailed(txType: string, chainId: number, error: string, txHash?: string) {
    this.trackEvent({
      type: 'error',
      category: 'transaction',
      message: 'Transaction failed',
      data: { txType, error },
      chainId,
      txHash,
    });
  }

  public trackContentUpload(contentType: string, fileSize: number, arweaveId?: string) {
    this.trackEvent({
      type: 'info',
      category: 'content',
      message: 'Content uploaded',
      data: { contentType, fileSize, arweaveId },
    });
  }

  public trackSearchQuery(query: string, resultsCount: number) {
    this.trackEvent({
      type: 'user_action',
      category: 'search',
      message: 'Search performed',
      data: { query: query.substring(0, 100), resultsCount }, // Limit query length for privacy
    });
  }
}

// Global monitoring instance
export const monitoring = new MonitoringService();

// Error boundary helper
export const withErrorTracking = (component: string) => {
  return (error: Error, errorInfo: any) => {
    monitoring.trackError({
      error,
      context: {
        component,
        additionalData: errorInfo,
      },
    });
  };
};

// Performance measurement helper
export const measurePerformance = async <T>(
  name: string,
  operation: () => Promise<T>,
  tags?: { [key: string]: string }
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    monitoring.trackPerformance({
      name,
      value: duration,
      unit: 'ms',
      tags,
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    monitoring.trackPerformance({
      name: `${name}_failed`,
      value: duration,
      unit: 'ms',
      tags,
    });
    
    throw error;
  }
};