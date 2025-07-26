import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { Shield, Eye, EyeOff, Key, Lock } from 'lucide-react';

interface ZKProof {
  proof: string;
  publicSignals: string[];
  nullifierHash: string;
  commitment: string;
}

interface PrivacySettings {
  enableZKProofs: boolean;
  hideTransactionAmounts: boolean;
  usePrivacyMixing: boolean;
  anonymousVoting: boolean;
  privateMessaging: boolean;
}

interface ZeroKnowledgeAuthProps {
  onProofGenerated?: (proof: ZKProof) => void;
  className?: string;
}

export const ZeroKnowledgeAuth: React.FC<ZeroKnowledgeAuthProps> = ({
  onProofGenerated,
  className = ''
}) => {
  const { account, isConnected } = useWallet();
  const { executeTransaction } = useContractManager();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    enableZKProofs: false,
    hideTransactionAmounts: false,
    usePrivacyMixing: false,
    anonymousVoting: false,
    privateMessaging: false
  });
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [zkProof, setZkProof] = useState<ZKProof | null>(null);
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (account) {
      loadPrivacySettings();
    }
  }, [account]);

  const loadPrivacySettings = async () => {
    try {
      // Load user's privacy settings from localStorage or blockchain
      const savedSettings = localStorage.getItem(`privacy_settings_${account}`);
      if (savedSettings) {
        setPrivacySettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  const savePrivacySettings = async (newSettings: PrivacySettings) => {
    try {
      setPrivacySettings(newSettings);
      localStorage.setItem(`privacy_settings_${account}`, JSON.stringify(newSettings));
      
      // Optionally save to blockchain for cross-device sync
      if (isConnected) {
        await executeTransaction('libertyDAO', 'updatePrivacySettings', [
          JSON.stringify(newSettings)
        ]);
      }
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    }
  };

  const generateZKProof = async () => {
    if (!secret.trim()) {
      alert('Please enter a secret to generate proof');
      return;
    }

    setIsGeneratingProof(true);
    try {
      // Simulate ZK proof generation (in real implementation, would use circom/snarkjs)
      const mockProof = await generateMockZKProof(secret, account!);
      setZkProof(mockProof);
      
      if (onProofGenerated) {
        onProofGenerated(mockProof);
      }

      // Clear the secret for security
      setSecret('');
      setShowSecret(false);
    } catch (error) {
      console.error('Failed to generate ZK proof:', error);
      alert('Failed to generate zero-knowledge proof');
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const generateMockZKProof = async (secret: string, userAddress: string): Promise<ZKProof> => {
    // Mock ZK proof generation - in real implementation would use actual ZK libraries
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate computation time
    
    const commitment = generateCommitment(secret, userAddress);
    const nullifierHash = generateNullifierHash(secret, userAddress);
    
    return {
      proof: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      publicSignals: [commitment, nullifierHash],
      nullifierHash,
      commitment
    };
  };

  const generateCommitment = (secret: string, address: string): string => {
    // Mock commitment generation
    const combined = secret + address + Date.now();
    return `0x${Array.from(combined).map(c => c.charCodeAt(0).toString(16)).join('').slice(0, 64)}`;
  };

  const generateNullifierHash = (secret: string, address: string): string => {
    // Mock nullifier hash generation
    const combined = secret + address + 'nullifier';
    return `0x${Array.from(combined).map(c => c.charCodeAt(0).toString(16)).join('').slice(0, 64)}`;
  };

  const verifyZKProof = async (proof: ZKProof): Promise<boolean> => {
    try {
      // In real implementation, would verify using ZK verifier contract
      await executeTransaction('libertyDAO', 'verifyZKProof', [
        proof.proof,
        proof.publicSignals
      ]);
      return true;
    } catch (error) {
      console.error('ZK proof verification failed:', error);
      return false;
    }
  };

  const updatePrivacySetting = (key: keyof PrivacySettings, value: boolean) => {
    const newSettings = { ...privacySettings, [key]: value };
    savePrivacySettings(newSettings);
  };

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 text-center ${className}`}>
        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy Protection</h3>
        <p className="text-gray-600">Connect your wallet to access advanced privacy features</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Zero-Knowledge Privacy</h2>
        </div>
        <p className="text-gray-600 mt-2">
          Protect your privacy with zero-knowledge proofs and advanced encryption
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* ZK Proof Generation */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Generate Zero-Knowledge Proof</h3>
          <p className="text-blue-700 text-sm mb-4">
            Create a cryptographic proof that verifies your identity without revealing personal information
          </p>
          
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter your secret (will not be stored)"
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 pr-10"
              />
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <button
              onClick={generateZKProof}
              disabled={isGeneratingProof || !secret.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGeneratingProof ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating Proof...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Generate ZK Proof</span>
                </>
              )}
            </button>
          </div>

          {zkProof && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Proof Generated Successfully</span>
              </div>
              <div className="text-xs text-green-700 space-y-1">
                <div>Commitment: {zkProof.commitment.slice(0, 20)}...</div>
                <div>Nullifier: {zkProof.nullifierHash.slice(0, 20)}...</div>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Settings */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Privacy Settings</h3>
          <div className="space-y-4">
            {[
              {
                key: 'enableZKProofs' as keyof PrivacySettings,
                label: 'Enable Zero-Knowledge Proofs',
                description: 'Use ZK proofs for identity verification without revealing personal data'
              },
              {
                key: 'hideTransactionAmounts' as keyof PrivacySettings,
                label: 'Hide Transaction Amounts',
                description: 'Keep transaction amounts private from public view'
              },
              {
                key: 'usePrivacyMixing' as keyof PrivacySettings,
                label: 'Privacy Mixing',
                description: 'Mix transactions with others for enhanced anonymity'
              },
              {
                key: 'anonymousVoting' as keyof PrivacySettings,
                label: 'Anonymous Voting',
                description: 'Vote on governance proposals anonymously'
              },
              {
                key: 'privateMessaging' as keyof PrivacySettings,
                label: 'Private Messaging',
                description: 'Enable end-to-end encrypted messaging'
              }
            ].map(setting => (
              <div key={setting.key} className="flex items-start space-x-3">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={privacySettings[setting.key]}
                    onChange={(e) => updatePrivacySetting(setting.key, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="font-medium text-gray-900">{setting.label}</label>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Privacy Status</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">ZK Proofs:</span>
              <span className={`ml-2 ${privacySettings.enableZKProofs ? 'text-green-600' : 'text-gray-400'}`}>
                {privacySettings.enableZKProofs ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Privacy Mixing:</span>
              <span className={`ml-2 ${privacySettings.usePrivacyMixing ? 'text-green-600' : 'text-gray-400'}`}>
                {privacySettings.usePrivacyMixing ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Anonymous Voting:</span>
              <span className={`ml-2 ${privacySettings.anonymousVoting ? 'text-green-600' : 'text-gray-400'}`}>
                {privacySettings.anonymousVoting ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Private Messages:</span>
              <span className={`ml-2 ${privacySettings.privateMessaging ? 'text-green-600' : 'text-gray-400'}`}>
                {privacySettings.privateMessaging ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};