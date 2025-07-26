import React, { useState } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { Shield, Lock, Fingerprint, Eye, Shuffle, AlertTriangle, CheckCircle } from 'lucide-react';
import { ZeroKnowledgeAuth } from './ZeroKnowledgeAuth';
import { ContentEncryption } from './ContentEncryption';
import { BiometricAuth } from './BiometricAuth';
import { PrivacyMixing } from './PrivacyMixing';
import { EndToEndEncryption } from './EndToEndEncryption';
import { ZeroKnowledgeProofs } from './ZeroKnowledgeProofs';
import { FraudDetection } from './FraudDetection';

type SecurityTab = 
  | 'overview' 
  | 'zk-auth' 
  | 'encryption' 
  | 'biometric' 
  | 'privacy-mixing' 
  | 'e2e-encryption' 
  | 'zk-proofs' 
  | 'fraud-detection';

interface SecurityFeature {
  id: SecurityTab;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'enabled' | 'disabled' | 'partial';
  riskLevel: 'low' | 'medium' | 'high';
}

interface SecurityDashboardProps {
  className?: string;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  className = ''
}) => {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<SecurityTab>('overview');

  const securityFeatures: SecurityFeature[] = [
    {
      id: 'zk-auth',
      name: 'Zero-Knowledge Authentication',
      description: 'Privacy-preserving identity verification without revealing personal data',
      icon: Shield,
      status: 'enabled',
      riskLevel: 'low'
    },
    {
      id: 'encryption',
      name: 'Content Encryption',
      description: 'Client-side encryption for premium content with secure key management',
      icon: Lock,
      status: 'enabled',
      riskLevel: 'low'
    },
    {
      id: 'biometric',
      name: 'Biometric Authentication',
      description: 'Fingerprint, face, and hardware wallet authentication',
      icon: Fingerprint,
      status: 'partial',
      riskLevel: 'medium'
    },
    {
      id: 'privacy-mixing',
      name: 'Privacy Mixing',
      description: 'Transaction mixing for enhanced anonymity and privacy',
      icon: Shuffle,
      status: 'enabled',
      riskLevel: 'low'
    },
    {
      id: 'e2e-encryption',
      name: 'End-to-End Encryption',
      description: 'Complete encryption pipeline for premium content access',
      icon: Lock,
      status: 'enabled',
      riskLevel: 'low'
    },
    {
      id: 'zk-proofs',
      name: 'Zero-Knowledge Proofs',
      description: 'Mathematical proofs that verify information without revealing it',
      icon: Eye,
      status: 'enabled',
      riskLevel: 'low'
    },
    {
      id: 'fraud-detection',
      name: 'Fraud Detection',
      description: 'Real-time monitoring and prevention of suspicious activities',
      icon: AlertTriangle,
      status: 'enabled',
      riskLevel: 'low'
    }
  ];

  const getStatusColor = (status: SecurityFeature['status']) => {
    switch (status) {
      case 'enabled': return 'bg-green-100 text-green-800';
      case 'disabled': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getRiskColor = (riskLevel: SecurityFeature['riskLevel']) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
    }
  };

  const calculateOverallSecurityScore = (): number => {
    const enabledFeatures = securityFeatures.filter(f => f.status === 'enabled').length;
    const partialFeatures = securityFeatures.filter(f => f.status === 'partial').length;
    const totalFeatures = securityFeatures.length;
    
    return Math.round(((enabledFeatures + partialFeatures * 0.5) / totalFeatures) * 100);
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const SecurityOverview: React.FC = () => {
    const securityScore = calculateOverallSecurityScore();
    
    return (
      <div className="space-y-6">
        {/* Security Score */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Security Score</h3>
              <p className="text-gray-600">Overall security posture of your account</p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getSecurityScoreColor(securityScore)}`}>
                {securityScore}%
              </div>
              <div className="text-sm text-gray-600">
                {securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                securityScore >= 80 ? 'bg-green-500' : 
                securityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${securityScore}%` }}
            />
          </div>
        </div>

        {/* Security Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {securityFeatures.map(feature => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className="bg-white border rounded-lg p-4 text-left hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                      {feature.status.charAt(0).toUpperCase() + feature.status.slice(1)}
                    </span>
                    <span className={`text-xs font-medium ${getRiskColor(feature.riskLevel)}`}>
                      {feature.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{feature.name}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </button>
            );
          })}
        </div>

        {/* Security Recommendations */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">Security Recommendations</h3>
              <div className="mt-2 space-y-1 text-sm text-yellow-700">
                {securityScore < 100 && (
                  <p>• Enable all security features for maximum protection</p>
                )}
                {securityFeatures.some(f => f.status === 'partial') && (
                  <p>• Complete setup for partially configured features</p>
                )}
                <p>• Regularly review and update your security settings</p>
                <p>• Monitor fraud detection alerts and respond promptly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Security Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab('biometric')}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <Fingerprint className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Setup Biometric Auth</span>
            </button>
            
            <button
              onClick={() => setActiveTab('zk-proofs')}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <Eye className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Generate ZK Proof</span>
            </button>
            
            <button
              onClick={() => setActiveTab('privacy-mixing')}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <Shuffle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Mix Transaction</span>
            </button>
            
            <button
              onClick={() => setActiveTab('fraud-detection')}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium">Security Scan</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SecurityOverview />;
      case 'zk-auth':
        return <ZeroKnowledgeAuth />;
      case 'encryption':
        return <ContentEncryption />;
      case 'biometric':
        return <BiometricAuth />;
      case 'privacy-mixing':
        return <PrivacyMixing />;
      case 'e2e-encryption':
        return <EndToEndEncryption />;
      case 'zk-proofs':
        return <ZeroKnowledgeProofs />;
      case 'fraud-detection':
        return <FraudDetection />;
      default:
        return <SecurityOverview />;
    }
  };

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 text-center ${className}`}>
        <Shield className="w-16 h-16 mx-auto mb-6 text-gray-400" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Advanced Security & Privacy</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Connect your wallet to access comprehensive security features including zero-knowledge proofs, 
          biometric authentication, end-to-end encryption, and real-time fraud detection.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {securityFeatures.slice(0, 4).map(feature => {
            const Icon = feature.icon;
            return (
              <div key={feature.id} className="text-center">
                <div className="p-3 bg-gray-100 rounded-lg mx-auto w-fit mb-2">
                  <Icon className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">{feature.name}</h3>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Security & Privacy Center</h1>
            <p className="text-gray-600">
              Advanced security features to protect your identity, transactions, and content
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', name: 'Overview', icon: Shield },
              { id: 'zk-auth', name: 'ZK Auth', icon: Shield },
              { id: 'encryption', name: 'Encryption', icon: Lock },
              { id: 'biometric', name: 'Biometric', icon: Fingerprint },
              { id: 'privacy-mixing', name: 'Privacy Mixing', icon: Shuffle },
              { id: 'e2e-encryption', name: 'E2E Encryption', icon: Lock },
              { id: 'zk-proofs', name: 'ZK Proofs', icon: Eye },
              { id: 'fraud-detection', name: 'Fraud Detection', icon: AlertTriangle }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SecurityTab)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
};