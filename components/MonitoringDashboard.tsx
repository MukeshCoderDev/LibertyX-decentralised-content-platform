import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { monitoring } from '../lib/monitoring';

interface SystemMetrics {
  uptime: number;
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageResponseTime: number;
  errorRate: number;
  networkStatus: 'healthy' | 'degraded' | 'down';
}

interface BlockchainMetrics {
  [chainId: number]: {
    name: string;
    rpcLatency: number;
    blockHeight: number;
    gasPrice: string;
    status: 'connected' | 'disconnected' | 'slow';
  };
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export const MonitoringDashboard: React.FC = () => {
  const { account: _account, isConnected } = useWallet();
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [blockchainMetrics, setBlockchainMetrics] = useState<BlockchainMetrics>({});
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      // Mock data - in real implementation, this would fetch from monitoring service
      const mockSystemMetrics: SystemMetrics = {
        uptime: 99.9,
        totalUsers: 15420,
        activeUsers: 1250,
        totalTransactions: 45680,
        successfulTransactions: 44890,
        failedTransactions: 790,
        averageResponseTime: 245,
        errorRate: 1.7,
        networkStatus: 'healthy',
      };

      const mockBlockchainMetrics: BlockchainMetrics = {
        1: {
          name: 'Ethereum',
          rpcLatency: 120,
          blockHeight: 19234567,
          gasPrice: '25.5',
          status: 'connected',
        },
        137: {
          name: 'Polygon',
          rpcLatency: 85,
          blockHeight: 52345678,
          gasPrice: '30.2',
          status: 'connected',
        },
        42161: {
          name: 'Arbitrum',
          rpcLatency: 95,
          blockHeight: 178234567,
          gasPrice: '0.1',
          status: 'connected',
        },
      };

      const mockAlerts: AlertItem[] = [
        {
          id: '1',
          type: 'warning',
          message: 'High gas prices detected on Ethereum (>50 gwei)',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          resolved: false,
        },
        {
          id: '2',
          type: 'error',
          message: 'Arweave upload failure rate increased to 5%',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          resolved: true,
        },
        {
          id: '3',
          type: 'info',
          message: 'New deployment completed successfully',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          resolved: true,
        },
      ];

      setSystemMetrics(mockSystemMetrics);
      setBlockchainMetrics(mockBlockchainMetrics);
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading metrics:', error);
      monitoring.trackError({
        error: error as Error,
        context: { component: 'MonitoringDashboard', action: 'loadMetrics' },
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-400';
      case 'degraded':
      case 'slow':
        return 'text-yellow-400';
      case 'down':
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-900 border-red-700 text-red-300';
      case 'warning':
        return 'bg-yellow-900 border-yellow-700 text-yellow-300';
      case 'info':
        return 'bg-blue-900 border-blue-700 text-blue-300';
      default:
        return 'bg-gray-900 border-gray-700 text-gray-300';
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to access monitoring dashboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">System Monitoring</h1>
            <p className="text-gray-400 mt-2">Real-time platform health and performance metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={loadMetrics}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* System Health Overview */}
        {systemMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-green-500">
              <h3 className="text-lg font-semibold mb-2">System Uptime</h3>
              <p className="text-3xl font-bold text-green-400">{systemMetrics.uptime}%</p>
              <p className={`text-sm mt-1 ${getStatusColor(systemMetrics.networkStatus)}`}>
                Status: {systemMetrics.networkStatus}
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold mb-2">Active Users</h3>
              <p className="text-3xl font-bold text-blue-400">{systemMetrics.activeUsers.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">
                Total: {systemMetrics.totalUsers.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold mb-2">Transaction Success</h3>
              <p className="text-3xl font-bold text-purple-400">
                {((systemMetrics.successfulTransactions / systemMetrics.totalTransactions) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {systemMetrics.successfulTransactions.toLocaleString()} / {systemMetrics.totalTransactions.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-yellow-500">
              <h3 className="text-lg font-semibold mb-2">Response Time</h3>
              <p className="text-3xl font-bold text-yellow-400">{systemMetrics.averageResponseTime}ms</p>
              <p className="text-sm text-gray-400 mt-1">
                Error Rate: {systemMetrics.errorRate}%
              </p>
            </div>
          </div>
        )}

        {/* Blockchain Networks Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Blockchain Networks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(blockchainMetrics).map(([chainId, metrics]) => (
              <div key={chainId} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">{metrics.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    metrics.status === 'connected' 
                      ? 'bg-green-900 text-green-300' 
                      : metrics.status === 'slow'
                      ? 'bg-yellow-900 text-yellow-300'
                      : 'bg-red-900 text-red-300'
                  }`}>
                    {metrics.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">RPC Latency:</span>
                    <span className={metrics.rpcLatency > 200 ? 'text-yellow-400' : 'text-green-400'}>
                      {metrics.rpcLatency}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Block Height:</span>
                    <span className="text-white">{metrics.blockHeight.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gas Price:</span>
                    <span className="text-white">{metrics.gasPrice} gwei</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts and Issues */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Recent Alerts</h3>
            <span className="text-sm text-gray-400">
              {alerts.filter(a => !a.resolved).length} active alerts
            </span>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">✅</div>
                <p>No alerts - all systems operational</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getAlertColor(alert.type)} ${
                    alert.resolved ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">
                          {alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        <span className="font-semibold capitalize">{alert.type}</span>
                        {alert.resolved && (
                          <span className="px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="mb-2">{alert.message}</p>
                      <p className="text-sm opacity-75">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!alert.resolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="ml-4 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
 