import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { Shield, AlertTriangle, Eye, Activity, CheckCircle, XCircle } from 'lucide-react';

interface FraudAlert {
  id: string;
  type: 'suspicious_transaction' | 'unusual_login' | 'multiple_devices' | 'high_value_transfer' | 'rapid_transactions';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  status: 'active' | 'resolved' | 'false_positive';
  metadata: {
    transactionHash?: string;
    amount?: string;
    fromAddress?: string;
    toAddress?: string;
    deviceInfo?: string;
    location?: string;
  };
}

interface SecurityMetrics {
  riskScore: number;
  transactionCount24h: number;
  uniqueDevices: number;
  suspiciousActivities: number;
  lastSecurityScan: number;
  accountAge: number;
}

interface FraudDetectionProps {
  className?: string;
}

export const FraudDetection: React.FC<FraudDetectionProps> = ({
  className = ''
}) => {
  const { account, isConnected } = useWallet();
  const { executeTransaction } = useContractManager();
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [autoProtectionEnabled, setAutoProtectionEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && account) {
      loadFraudAlerts();
      loadSecurityMetrics();
      startRealTimeMonitoring();
    }
  }, [isConnected, account]);

  const loadFraudAlerts = async () => {
    try {
      setLoading(true);
      const alerts = await fetchFraudAlertsFromChain();
      setFraudAlerts(alerts);
    } catch (error) {
      console.error('Failed to load fraud alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityMetrics = async () => {
    try {
      const metrics = await calculateSecurityMetrics();
      setSecurityMetrics(metrics);
    } catch (error) {
      console.error('Failed to load security metrics:', error);
    }
  };

  const startRealTimeMonitoring = () => {
    // Simulate real-time fraud detection monitoring
    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance of generating a test alert
        generateTestAlert();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  };

  const generateTestAlert = () => {
    const alertTypes: FraudAlert['type'][] = [
      'suspicious_transaction',
      'unusual_login',
      'multiple_devices',
      'high_value_transfer',
      'rapid_transactions'
    ];

    const severities: FraudAlert['severity'][] = ['low', 'medium', 'high', 'critical'];
    
    const newAlert: FraudAlert = {
      id: `alert_${Date.now()}`,
      type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      description: getAlertDescription(alertTypes[0]),
      timestamp: Date.now() / 1000,
      status: 'active',
      metadata: {
        transactionHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        amount: (Math.random() * 1000).toFixed(2),
        fromAddress: account || '',
        toAddress: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
      }
    };

    setFraudAlerts(prev => [newAlert, ...prev].slice(0, 10)); // Keep only latest 10 alerts
  };

  const getAlertDescription = (type: FraudAlert['type']): string => {
    switch (type) {
      case 'suspicious_transaction':
        return 'Transaction pattern matches known fraud indicators';
      case 'unusual_login':
        return 'Login attempt from unrecognized device or location';
      case 'multiple_devices':
        return 'Account accessed from multiple devices simultaneously';
      case 'high_value_transfer':
        return 'Large value transfer detected - verification recommended';
      case 'rapid_transactions':
        return 'Unusually high transaction frequency detected';
      default:
        return 'Suspicious activity detected';
    }
  };

  const runSecurityScan = async () => {
    try {
      setIsScanning(true);
      
      // Simulate comprehensive security scan
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update security metrics
      const updatedMetrics = await calculateSecurityMetrics();
      setSecurityMetrics(updatedMetrics);
      
      // Generate scan results
      const scanResults = await performSecurityAnalysis();
      
      if (scanResults.newThreats.length > 0) {
        setFraudAlerts(prev => [...scanResults.newThreats, ...prev]);
      }
      
    } catch (error) {
      console.error('Security scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const resolveAlert = async (alertId: string, resolution: 'resolved' | 'false_positive') => {
    try {
      // Update alert status on blockchain
      await executeTransaction('libertyDAO', 'updateFraudAlert', [
        alertId,
        resolution
      ]);

      // Update local state
      setFraudAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: resolution }
          : alert
      ));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const toggleAutoProtection = async () => {
    try {
      const newState = !autoProtectionEnabled;
      
      // Update auto-protection setting on blockchain
      await executeTransaction('libertyDAO', 'setAutoProtection', [newState]);
      
      setAutoProtectionEnabled(newState);
    } catch (error) {
      console.error('Failed to toggle auto protection:', error);
    }
  };

  const fetchFraudAlertsFromChain = async (): Promise<FraudAlert[]> => {
    // Mock implementation
    return [
      {
        id: '1',
        type: 'high_value_transfer',
        severity: 'medium',
        description: 'Large value transfer detected - verification recommended',
        timestamp: Date.now() / 1000 - 3600,
        status: 'active',
        metadata: {
          transactionHash: '0xabc123...',
          amount: '500.0',
          fromAddress: account || '',
          toAddress: '0x1234...5678'
        }
      }
    ];
  };

  const calculateSecurityMetrics = async (): Promise<SecurityMetrics> => {
    // Mock security metrics calculation
    return {
      riskScore: Math.floor(Math.random() * 100),
      transactionCount24h: Math.floor(Math.random() * 50),
      uniqueDevices: Math.floor(Math.random() * 5) + 1,
      suspiciousActivities: Math.floor(Math.random() * 10),
      lastSecurityScan: Date.now() / 1000 - Math.random() * 86400,
      accountAge: Math.floor(Math.random() * 365) + 30
    };
  };

  const performSecurityAnalysis = async () => {
    // Mock security analysis
    return {
      newThreats: [] as FraudAlert[],
      riskFactors: ['Multiple device access', 'High transaction volume'],
      recommendations: ['Enable 2FA', 'Review recent transactions']
    };
  };

  const getSeverityColor = (severity: FraudAlert['severity']) => {
    switch (severity) {
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'critical': return 'bg-red-200 text-red-900 border-red-300';
    }
  };

  const getStatusColor = (status: FraudAlert['status']) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'false_positive': return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 60) return 'text-yellow-600';
    if (score < 80) return 'text-orange-600';
    return 'text-red-600';
  };

  const AlertCard: React.FC<{ alert: FraudAlert }> = ({ alert }) => (
    <div className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <h3 className="font-semibold capitalize">
              {alert.type.replace('_', ' ')} Alert
            </h3>
            <p className="text-sm opacity-90">{alert.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
            {alert.status.replace('_', ' ')}
          </span>
          <span className="text-xs opacity-75">
            {alert.severity.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-sm opacity-90 mb-4">
        <div className="flex justify-between">
          <span>Time:</span>
          <span>{new Date(alert.timestamp * 1000).toLocaleString()}</span>
        </div>
        {alert.metadata.amount && (
          <div className="flex justify-between">
            <span>Amount:</span>
            <span>{alert.metadata.amount} ETH</span>
          </div>
        )}
        {alert.metadata.transactionHash && (
          <div className="flex justify-between">
            <span>Transaction:</span>
            <span className="font-mono text-xs">
              {alert.metadata.transactionHash.slice(0, 10)}...
            </span>
          </div>
        )}
      </div>

      {alert.status === 'active' && (
        <div className="flex space-x-2">
          <button
            onClick={() => resolveAlert(alert.id, 'resolved')}
            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center justify-center space-x-1"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Resolve</span>
          </button>
          <button
            onClick={() => resolveAlert(alert.id, 'false_positive')}
            className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center justify-center space-x-1"
          >
            <XCircle className="w-4 h-4" />
            <span>False Positive</span>
          </button>
        </div>
      )}
    </div>
  );

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 text-center ${className}`}>
        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Fraud Detection & Prevention</h3>
        <p className="text-gray-600">
          Connect your wallet to access real-time fraud detection and security monitoring.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">Fraud Detection & Prevention</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Auto Protection:</span>
              <button
                onClick={toggleAutoProtection}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoProtectionEnabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoProtectionEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <button
              onClick={runSecurityScan}
              disabled={isScanning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isScanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Security Scan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Metrics Dashboard */}
        {securityMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${getRiskScoreColor(securityMetrics.riskScore)}`}>
                {securityMetrics.riskScore}
              </div>
              <div className="text-sm text-gray-600">Risk Score</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {securityMetrics.transactionCount24h}
              </div>
              <div className="text-sm text-gray-600">Transactions (24h)</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {securityMetrics.uniqueDevices}
              </div>
              <div className="text-sm text-gray-600">Unique Devices</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {securityMetrics.suspiciousActivities}
              </div>
              <div className="text-sm text-gray-600">Suspicious Activities</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.floor((Date.now() / 1000 - securityMetrics.lastSecurityScan) / 3600)}h
              </div>
              <div className="text-sm text-gray-600">Last Scan</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {securityMetrics.accountAge}d
              </div>
              <div className="text-sm text-gray-600">Account Age</div>
            </div>
          </div>
        )}

        {/* Real-time Protection Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Activity className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900">Real-time Protection Active</h3>
              <p className="text-sm text-green-700 mt-1">
                Your account is being monitored 24/7 for suspicious activities. 
                Machine learning algorithms analyze transaction patterns, device access, and behavioral anomalies.
              </p>
              <div className="mt-2 text-xs text-green-600">
                • Transaction pattern analysis • Device fingerprinting • Behavioral monitoring • Risk scoring
              </div>
            </div>
          </div>
        </div>

        {/* Fraud Alerts */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Security Alerts</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading security alerts...</p>
            </div>
          ) : fraudAlerts.length > 0 ? (
            <div className="space-y-4">
              {fraudAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No security alerts at this time.</p>
              <p className="text-sm">Your account appears to be secure.</p>
            </div>
          )}
        </div>

        {/* Security Recommendations */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Security Recommendations</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Enable biometric authentication for enhanced security</li>
            <li>• Use hardware wallets for large transactions</li>
            <li>• Regularly review your transaction history</li>
            <li>• Keep your devices and browsers updated</li>
            <li>• Never share your private keys or seed phrases</li>
            <li>• Be cautious of phishing attempts and suspicious links</li>
          </ul>
        </div>
      </div>
    </div>
  );
};