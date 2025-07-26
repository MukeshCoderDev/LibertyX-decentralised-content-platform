import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { Fingerprint, Shield, Smartphone, Key, Lock, CheckCircle, AlertTriangle, Usb } from 'lucide-react';

interface BiometricCredential {
  id: string;
  type: 'fingerprint' | 'face' | 'voice';
  publicKey: string;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
}

interface HardwareWallet {
  id: string;
  name: string;
  type: 'ledger' | 'trezor' | 'yubikey';
  isConnected: boolean;
  publicKey: string;
  lastConnected: number;
}

interface BiometricAuthProps {
  onAuthSuccess?: (credential: BiometricCredential) => void;
  onHardwareWalletConnected?: (wallet: HardwareWallet) => void;
  className?: string;
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({
  onAuthSuccess,
  onHardwareWalletConnected,
  className = ''
}) => {
  const { account, isConnected } = useWallet();
  const { executeTransaction } = useContractManager();
  const [biometricCredentials, setBiometricCredentials] = useState<BiometricCredential[]>([]);
  const [hardwareWallets, setHardwareWallets] = useState<HardwareWallet[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isConnectingHardware, setIsConnectingHardware] = useState(false);
  const [biometricSupport, setBiometricSupport] = useState({
    fingerprint: false,
    face: false,
    voice: false
  });
  const [selectedBiometricType, setSelectedBiometricType] = useState<BiometricCredential['type']>('fingerprint');
  const [authStatus, setAuthStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  useEffect(() => {
    checkBiometricSupport();
    if (isConnected && account) {
      loadBiometricCredentials();
      loadHardwareWallets();
    }
  }, [isConnected, account]);

  const checkBiometricSupport = async () => {
    try {
      // Check if WebAuthn is supported
      const isWebAuthnSupported = !!window.PublicKeyCredential;
      
      if (isWebAuthnSupported) {
        // Check for specific biometric capabilities
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricSupport({
          fingerprint: available,
          face: available,
          voice: false // Voice recognition would need additional APIs
        });
      }
    } catch (error) {
      console.error('Failed to check biometric support:', error);
    }
  };

  const enrollBiometric = async (type: BiometricCredential['type']) => {
    if (!isConnected || !account) return;

    try {
      setIsEnrolling(true);

      // Create WebAuthn credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: 'Liberty Platform',
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode(account),
            name: account,
            displayName: `User ${account.slice(0, 6)}...${account.slice(-4)}`
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: false
          },
          timeout: 60000,
          attestation: 'direct'
        }
      }) as PublicKeyCredential;

      if (credential) {
        const newCredential: BiometricCredential = {
          id: credential.id,
          type,
          publicKey: arrayBufferToBase64(credential.response.publicKey!),
          createdAt: Date.now() / 1000,
          lastUsed: Date.now() / 1000,
          isActive: true
        };

        // Store credential on blockchain
        await executeTransaction('libertyDAO', 'registerBiometricCredential', [
          newCredential.id,
          newCredential.type,
          newCredential.publicKey
        ]);

        // Update local state
        setBiometricCredentials(prev => [...prev, newCredential]);
        setAuthStatus('success');
        
        if (onAuthSuccess) {
          onAuthSuccess(newCredential);
        }
      }
    } catch (error) {
      console.error('Biometric enrollment failed:', error);
      setAuthStatus('failed');
    } finally {
      setIsEnrolling(false);
    }
  };

  const authenticateWithBiometric = async (credentialId: string) => {
    try {
      setIsAuthenticating(true);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [{
            id: base64ToArrayBuffer(credentialId),
            type: 'public-key'
          }],
          userVerification: 'required',
          timeout: 60000
        }
      }) as PublicKeyCredential;

      if (credential) {
        // Verify authentication with smart contract
        const isValid = await executeTransaction('libertyDAO', 'verifyBiometricAuth', [
          credential.id,
          arrayBufferToBase64(credential.response.signature),
          arrayBufferToBase64(credential.response.authenticatorData)
        ]);

        if (isValid) {
          // Update last used timestamp
          setBiometricCredentials(prev => prev.map(cred => 
            cred.id === credentialId 
              ? { ...cred, lastUsed: Date.now() / 1000 }
              : cred
          ));
          
          setAuthStatus('success');
          
          const authenticatedCredential = biometricCredentials.find(c => c.id === credentialId);
          if (authenticatedCredential && onAuthSuccess) {
            onAuthSuccess(authenticatedCredential);
          }
        } else {
          setAuthStatus('failed');
        }
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      setAuthStatus('failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const connectHardwareWallet = async (type: HardwareWallet['type']) => {
    try {
      setIsConnectingHardware(true);

      let wallet: HardwareWallet | null = null;

      switch (type) {
        case 'ledger':
          wallet = await connectLedger();
          break;
        case 'trezor':
          wallet = await connectTrezor();
          break;
        case 'yubikey':
          wallet = await connectYubiKey();
          break;
      }

      if (wallet) {
        // Register hardware wallet on blockchain
        await executeTransaction('libertyDAO', 'registerHardwareWallet', [
          wallet.id,
          wallet.type,
          wallet.publicKey
        ]);

        setHardwareWallets(prev => [...prev, wallet!]);
        
        if (onHardwareWalletConnected) {
          onHardwareWalletConnected(wallet);
        }
      }
    } catch (error) {
      console.error('Hardware wallet connection failed:', error);
    } finally {
      setIsConnectingHardware(false);
    }
  };

  const connectLedger = async (): Promise<HardwareWallet | null> => {
    // Mock Ledger connection - would use @ledgerhq/hw-transport-webusb
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      id: 'ledger_' + Date.now(),
      name: 'Ledger Nano S',
      type: 'ledger',
      isConnected: true,
      publicKey: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      lastConnected: Date.now() / 1000
    };
  };

  const connectTrezor = async (): Promise<HardwareWallet | null> => {
    // Mock Trezor connection - would use trezor-connect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      id: 'trezor_' + Date.now(),
      name: 'Trezor Model T',
      type: 'trezor',
      isConnected: true,
      publicKey: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      lastConnected: Date.now() / 1000
    };
  };

  const connectYubiKey = async (): Promise<HardwareWallet | null> => {
    // Mock YubiKey connection - would use WebAuthn with FIDO2
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      id: 'yubikey_' + Date.now(),
      name: 'YubiKey 5 NFC',
      type: 'yubikey',
      isConnected: true,
      publicKey: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      lastConnected: Date.now() / 1000
    };
  };

  const loadBiometricCredentials = async () => {
    try {
      // Mock loading from blockchain
      const credentials: BiometricCredential[] = [];
      setBiometricCredentials(credentials);
    } catch (error) {
      console.error('Failed to load biometric credentials:', error);
    }
  };

  const loadHardwareWallets = async () => {
    try {
      // Mock loading from blockchain
      const wallets: HardwareWallet[] = [];
      setHardwareWallets(wallets);
    } catch (error) {
      console.error('Failed to load hardware wallets:', error);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const getBiometricIcon = (type: BiometricCredential['type']) => {
    switch (type) {
      case 'fingerprint': return Fingerprint;
      case 'face': return Smartphone;
      case 'voice': return Key;
    }
  };

  const getHardwareWalletIcon = (type: HardwareWallet['type']) => {
    switch (type) {
      case 'ledger': return Usb;
      case 'trezor': return Usb;
      case 'yubikey': return Key;
    }
  };

  const BiometricCredentialCard: React.FC<{ credential: BiometricCredential }> = ({ credential }) => {
    const Icon = getBiometricIcon(credential.type);
    
    return (
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 capitalize">{credential.type} Authentication</h3>
              <p className="text-sm text-gray-600">ID: {credential.id.slice(0, 12)}...</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            credential.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {credential.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex justify-between">
            <span>Created:</span>
            <span>{new Date(credential.createdAt * 1000).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Used:</span>
            <span>{new Date(credential.lastUsed * 1000).toLocaleDateString()}</span>
          </div>
        </div>

        <button
          onClick={() => authenticateWithBiometric(credential.id)}
          disabled={isAuthenticating}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {isAuthenticating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <Icon className="w-4 h-4" />
              <span>Authenticate</span>
            </>
          )}
        </button>
      </div>
    );
  };

  const HardwareWalletCard: React.FC<{ wallet: HardwareWallet }> = ({ wallet }) => {
    const Icon = getHardwareWalletIcon(wallet.type);
    
    return (
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{wallet.name}</h3>
              <p className="text-sm text-gray-600 capitalize">{wallet.type} Hardware Wallet</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            wallet.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {wallet.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Public Key:</span>
            <span className="font-mono text-xs">{wallet.publicKey.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between">
            <span>Last Connected:</span>
            <span>{new Date(wallet.lastConnected * 1000).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 text-center ${className}`}>
        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Authentication</h3>
        <p className="text-gray-600">
          Connect your wallet to set up biometric authentication and hardware wallet support.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Biometric & Hardware Authentication</h2>
        </div>

        {/* Authentication Status */}
        {authStatus !== 'idle' && (
          <div className={`mb-6 p-4 rounded-lg border ${
            authStatus === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {authStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                authStatus === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {authStatus === 'success' ? 'Authentication Successful' : 'Authentication Failed'}
              </span>
            </div>
          </div>
        )}

        {/* Biometric Support Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Device Capabilities</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Fingerprint className={`w-4 h-4 ${biometricSupport.fingerprint ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={biometricSupport.fingerprint ? 'text-green-700' : 'text-gray-600'}>
                Fingerprint {biometricSupport.fingerprint ? 'Available' : 'Not Available'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Smartphone className={`w-4 h-4 ${biometricSupport.face ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={biometricSupport.face ? 'text-green-700' : 'text-gray-600'}>
                Face ID {biometricSupport.face ? 'Available' : 'Not Available'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Key className={`w-4 h-4 ${biometricSupport.voice ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={biometricSupport.voice ? 'text-green-700' : 'text-gray-600'}>
                Voice {biometricSupport.voice ? 'Available' : 'Not Available'}
              </span>
            </div>
          </div>
        </div>

        {/* Enroll New Biometric */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Enroll Biometric Authentication</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {(['fingerprint', 'face', 'voice'] as const).map(type => {
              const Icon = getBiometricIcon(type);
              const isSupported = biometricSupport[type];
              
              return (
                <button
                  key={type}
                  onClick={() => setSelectedBiometricType(type)}
                  disabled={!isSupported}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    selectedBiometricType === type && isSupported
                      ? 'border-green-500 bg-green-50'
                      : isSupported
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${
                    isSupported ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <h4 className="font-medium text-gray-900 capitalize">{type}</h4>
                  <p className="text-xs text-gray-600">
                    {isSupported ? 'Available' : 'Not Supported'}
                  </p>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => enrollBiometric(selectedBiometricType)}
            disabled={isEnrolling || !biometricSupport[selectedBiometricType]}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isEnrolling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Enrolling {selectedBiometricType}...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Enroll {selectedBiometricType.charAt(0).toUpperCase() + selectedBiometricType.slice(1)}</span>
              </>
            )}
          </button>
        </div>

        {/* Existing Biometric Credentials */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Your Biometric Credentials</h3>
          {biometricCredentials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {biometricCredentials.map(credential => (
                <BiometricCredentialCard key={credential.id} credential={credential} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Fingerprint className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No biometric credentials enrolled.</p>
              <p className="text-sm">Enroll your first biometric credential for enhanced security.</p>
            </div>
          )}
        </div>

        {/* Hardware Wallet Connection */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Connect Hardware Wallet</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {(['ledger', 'trezor', 'yubikey'] as const).map(type => {
              const Icon = getHardwareWalletIcon(type);
              
              return (
                <button
                  key={type}
                  onClick={() => connectHardwareWallet(type)}
                  disabled={isConnectingHardware}
                  className="p-4 border border-gray-200 rounded-lg text-center hover:border-gray-300 transition-colors disabled:opacity-50"
                >
                  <Icon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium text-gray-900 capitalize">{type}</h4>
                  <p className="text-xs text-gray-600">Hardware Wallet</p>
                </button>
              );
            })}
          </div>

          {isConnectingHardware && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Connecting hardware wallet...</p>
            </div>
          )}
        </div>

        {/* Connected Hardware Wallets */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Connected Hardware Wallets</h3>
          {hardwareWallets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hardwareWallets.map(wallet => (
                <HardwareWalletCard key={wallet.id} wallet={wallet} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Usb className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hardware wallets connected.</p>
              <p className="text-sm">Connect a hardware wallet for maximum security.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};