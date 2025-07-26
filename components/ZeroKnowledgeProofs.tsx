import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { Shield, Eye, EyeOff, Lock, Key, CheckCircle } from 'lucide-react';

interface ZKProof {
  id: string;
  type: 'age_verification' | 'identity_verification' | 'subscription_proof' | 'balance_proof';
  status: 'pending' | 'verified' | 'failed';
  createdAt: number;
  expiresAt: number;
  proof: string;
  publicSignals: string[];
}

interface ZeroKnowledgeProofsProps {
  className?: string;
}

export const ZeroKnowledgeProofs: React.FC<ZeroKnowledgeProofsProps> = ({
  className = ''
}) => {
  const { account, isConnected } = useWallet();
  const { executeTransaction } = useContractManager();
  const [proofs, setProofs] = useState<ZKProof[]>([]);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [selectedProofType, setSelectedProofType] = useState<ZKProof['type']>('age_verification');
  const [showPrivateData, setShowPrivateData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && account) {
      loadUserProofs();
    }
  }, [isConnected, account]);

  const loadUserProofs = async () => {
    try {
      setLoading(true);
      // Load existing ZK proofs for the user
      const userProofs = await fetchUserProofsFromChain();
      setProofs(userProofs);
    } catch (error) {
      console.error('Failed to load ZK proofs:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateZKProof = async (proofType: ZKProof['type']) => {
    if (!isConnected || !account) return;

    try {
      setIsGeneratingProof(true);

      // Generate zero-knowledge proof based on type
      const proofData = await generateProofForType(proofType);
      
      // Submit proof to blockchain
      await executeTransaction('libertyDAO', 'submitZKProof', [
        proofType,
        proofData.proof,
        proofData.publicSignals
      ]);

      // Refresh proofs list
      await loadUserProofs();
    } catch (error) {
      console.error('Failed to generate ZK proof:', error);
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const generateProofForType = async (proofType: ZKProof['type']) => {
    // Mock ZK proof generation - in real implementation would use libraries like snarkjs
    switch (proofType) {
      case 'age_verification':
        return await generateAgeVerificationProof();
      case 'identity_verification':
        return await generateIdentityVerificationProof();
      case 'subscription_proof':
        return await generateSubscriptionProof();
      case 'balance_proof':
        return await generateBalanceProof();
      default:
        throw new Error('Unknown proof type');
    }
  };

  const generateAgeVerificationProof = async () => {
    // Simulate ZK proof generation for age verification
    // In reality, this would use a ZK circuit to prove age > 18 without revealing actual age
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate computation time
    
    return {
      proof: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      publicSignals: ['1'] // 1 = age >= 18, without revealing actual age
    };
  };

  const generateIdentityVerificationProof = async () => {
    // Simulate ZK proof for identity verification
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    return {
      proof: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      publicSignals: ['1'] // 1 = identity verified, without revealing personal details
    };
  };

  const generateSubscriptionProof = async () => {
    // Simulate ZK proof for subscription status
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      proof: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      publicSignals: ['1'] // 1 = has valid subscription, without revealing which creator
    };
  };

  const generateBalanceProof = async () => {
    // Simulate ZK proof for minimum balance
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    return {
      proof: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      publicSignals: ['1'] // 1 = balance >= threshold, without revealing actual balance
    };
  };

  const fetchUserProofsFromChain = async (): Promise<ZKProof[]> => {
    // Mock implementation - would fetch from actual blockchain
    return [
      {
        id: '1',
        type: 'age_verification',
        status: 'verified',
        createdAt: Date.now() / 1000 - 86400,
        expiresAt: Date.now() / 1000 + 86400 * 30,
        proof: '0x1234...5678',
        publicSignals: ['1']
      }
    ];
  };

  const getProofTypeInfo = (type: ZKProof['type']) => {
    switch (type) {
      case 'age_verification':
        return {
          title: 'Age Verification',
          description: 'Prove you are 18+ without revealing your actual age',
          icon: Shield,
          color: 'text-blue-600'
        };
      case 'identity_verification':
        return {
          title: 'Identity Verification',
          description: 'Verify your identity without exposing personal details',
          icon: Key,
          color: 'text-green-600'
        };
      case 'subscription_proof':
        return {
          title: 'Subscription Proof',
          description: 'Prove subscription status without revealing which creator',
          icon: CheckCircle,
          color: 'text-purple-600'
        };
      case 'balance_proof':
        return {
          title: 'Balance Proof',
          description: 'Prove minimum balance without revealing actual amount',
          icon: Lock,
          color: 'text-orange-600'
        };
    }
  };

  const getStatusColor = (status: ZKProof['status']) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
    }
  };

  const ProofCard: React.FC<{ proof: ZKProof }> = ({ proof }) => {
    const info = getProofTypeInfo(proof.type);
    const Icon = info.icon;
    
    return (
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Icon className={`w-6 h-6 ${info.color}`} />
            <div>
              <h3 className="font-semibold text-gray-900">{info.title}</h3>
              <p className="text-sm text-gray-600">{info.description}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proof.status)}`}>
            {proof.status.charAt(0).toUpperCase() + proof.status.slice(1)}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Created:</span>
            <span>{new Date(proof.createdAt * 1000).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Expires:</span>
            <span>{new Date(proof.expiresAt * 1000).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Proof Hash:</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs">
                {showPrivateData ? proof.proof : proof.proof.slice(0, 10) + '...'}
              </span>
              <button
                onClick={() => setShowPrivateData(!showPrivateData)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPrivateData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 text-center ${className}`}>
        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Zero-Knowledge Privacy</h3>
        <p className="text-gray-600 mb-4">
          Connect your wallet to generate privacy-preserving proofs that verify information without revealing sensitive data.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Zero-Knowledge Proofs</h2>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Privacy-First Verification</h3>
              <p className="text-sm text-blue-700 mt-1">
                Zero-knowledge proofs allow you to verify information (age, identity, balance) without revealing the actual data. 
                Your privacy is mathematically guaranteed.
              </p>
            </div>
          </div>
        </div>

        {/* Generate New Proof */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Generate New Proof</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {(['age_verification', 'identity_verification', 'subscription_proof', 'balance_proof'] as const).map(type => {
              const info = getProofTypeInfo(type);
              const Icon = info.icon;
              
              return (
                <button
                  key={type}
                  onClick={() => setSelectedProofType(type)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    selectedProofType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${info.color}`} />
                    <div>
                      <h4 className="font-medium text-gray-900">{info.title}</h4>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => generateZKProof(selectedProofType)}
            disabled={isGeneratingProof}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isGeneratingProof ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating Proof...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Generate {getProofTypeInfo(selectedProofType).title}</span>
              </>
            )}
          </button>
        </div>

        {/* Existing Proofs */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Your Privacy Proofs</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading proofs...</p>
            </div>
          ) : proofs.length > 0 ? (
            <div className="space-y-4">
              {proofs.map(proof => (
                <ProofCard key={proof.id} proof={proof} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No privacy proofs generated yet.</p>
              <p className="text-sm">Generate your first proof to start using privacy features.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};