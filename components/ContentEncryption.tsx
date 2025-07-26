import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { Lock, Unlock, Key, Shield, Download, Upload } from 'lucide-react';

interface EncryptionKey {
  keyId: string;
  publicKey: string;
  encryptedPrivateKey: string;
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  createdAt: number;
}

interface EncryptedContent {
  contentId: number;
  encryptedData: string;
  encryptionKeyId: string;
  iv: string;
  authTag: string;
  metadata: {
    originalSize: number;
    mimeType: string;
    filename: string;
  };
}

interface ContentEncryptionProps {
  contentId?: number;
  isCreator?: boolean;
  className?: string;
}

export const ContentEncryption: React.FC<ContentEncryptionProps> = ({
  contentId,
  isCreator = false,
  className = ''
}) => {
  const { account, isConnected } = useWallet();
  const { executeTransaction } = useContractManager();
  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKey[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [encryptedContent, setEncryptedContent] = useState<EncryptedContent | null>(null);
  const [decryptedContent, setDecryptedContent] = useState<Blob | null>(null);
  const [encryptionProgress, setEncryptionProgress] = useState(0);

  useEffect(() => {
    if (account) {
      loadEncryptionKeys();
    }
  }, [account]);

  const loadEncryptionKeys = async () => {
    try {
      // Load user's encryption keys from secure storage
      const keys = await getStoredEncryptionKeys(account!);
      setEncryptionKeys(keys);
    } catch (error) {
      console.error('Failed to load encryption keys:', error);
    }
  };

  const generateEncryptionKey = async (): Promise<EncryptionKey> => {
    try {
      // Generate a new AES-256 key
      const key = await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );

      // Export the key
      const exportedKey = await window.crypto.subtle.exportKey('raw', key);
      const keyArray = new Uint8Array(exportedKey);
      
      // Create key ID
      const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In a real implementation, the private key would be encrypted with user's master key
      const encryptionKey: EncryptionKey = {
        keyId,
        publicKey: Array.from(keyArray.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''),
        encryptedPrivateKey: Array.from(keyArray).map(b => b.toString(16).padStart(2, '0')).join(''),
        algorithm: 'AES-256-GCM',
        createdAt: Date.now()
      };

      // Store the key securely
      await storeEncryptionKey(account!, encryptionKey);
      
      return encryptionKey;
    } catch (error) {
      console.error('Failed to generate encryption key:', error);
      throw error;
    }
  };

  const encryptContent = async (file: File): Promise<EncryptedContent> => {
    setIsEncrypting(true);
    setEncryptionProgress(0);

    try {
      // Get or generate encryption key
      let key = encryptionKeys[0];
      if (!key) {
        key = await generateEncryptionKey();
        setEncryptionKeys([key]);
      }

      setEncryptionProgress(25);

      // Read file as array buffer
      const fileBuffer = await file.arrayBuffer();
      
      setEncryptionProgress(50);

      // Import the encryption key
      const keyData = new Uint8Array(
        key.encryptedPrivateKey.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
      );
      
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      setEncryptionProgress(75);

      // Generate IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Encrypt the content
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        cryptoKey,
        fileBuffer
      );

      setEncryptionProgress(100);

      const encryptedData = new Uint8Array(encryptedBuffer);
      
      const encrypted: EncryptedContent = {
        contentId: contentId || Date.now(),
        encryptedData: Array.from(encryptedData).map(b => b.toString(16).padStart(2, '0')).join(''),
        encryptionKeyId: key.keyId,
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
        authTag: '', // Would be extracted from GCM mode
        metadata: {
          originalSize: file.size,
          mimeType: file.type,
          filename: file.name
        }
      };

      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    } finally {
      setIsEncrypting(false);
      setEncryptionProgress(0);
    }
  };

  const decryptContent = async (encrypted: EncryptedContent): Promise<Blob> => {
    setIsDecrypting(true);

    try {
      // Find the encryption key
      const key = encryptionKeys.find(k => k.keyId === encrypted.encryptionKeyId);
      if (!key) {
        throw new Error('Encryption key not found');
      }

      // Import the decryption key
      const keyData = new Uint8Array(
        key.encryptedPrivateKey.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
      );
      
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Convert encrypted data back to buffer
      const encryptedBuffer = new Uint8Array(
        encrypted.encryptedData.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
      );

      // Convert IV back to buffer
      const iv = new Uint8Array(
        encrypted.iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
      );

      // Decrypt the content
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        cryptoKey,
        encryptedBuffer
      );

      return new Blob([decryptedBuffer], { type: encrypted.metadata.mimeType });
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleEncrypt = async () => {
    if (!selectedFile) return;

    try {
      const encrypted = await encryptContent(selectedFile);
      setEncryptedContent(encrypted);
      
      // Store encrypted content metadata on blockchain
      if (isConnected) {
        await executeTransaction('contentRegistry', 'storeEncryptedContent', [
          encrypted.contentId,
          encrypted.encryptionKeyId,
          encrypted.iv,
          JSON.stringify(encrypted.metadata)
        ]);
      }
      
      alert('Content encrypted successfully!');
    } catch (error) {
      alert('Encryption failed: ' + (error as Error).message);
    }
  };

  const handleDecrypt = async () => {
    if (!encryptedContent) return;

    try {
      const decrypted = await decryptContent(encryptedContent);
      setDecryptedContent(decrypted);
      
      // Create download link
      const url = URL.createObjectURL(decrypted);
      const a = document.createElement('a');
      a.href = url;
      a.download = encryptedContent.metadata.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Content decrypted and downloaded!');
    } catch (error) {
      alert('Decryption failed: ' + (error as Error).message);
    }
  };

  const getStoredEncryptionKeys = async (userAddress: string): Promise<EncryptionKey[]> => {
    // Mock implementation - would use secure storage
    const stored = localStorage.getItem(`encryption_keys_${userAddress}`);
    return stored ? JSON.parse(stored) : [];
  };

  const storeEncryptionKey = async (userAddress: string, key: EncryptionKey) => {
    const existing = await getStoredEncryptionKeys(userAddress);
    const updated = [...existing, key];
    localStorage.setItem(`encryption_keys_${userAddress}`, JSON.stringify(updated));
  };

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 text-center ${className}`}>
        <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Encryption</h3>
        <p className="text-gray-600">Connect your wallet to access encryption features</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <Lock className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold">End-to-End Content Encryption</h2>
        </div>
        <p className="text-gray-600 mt-2">
          Encrypt premium content with client-side encryption for maximum security
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Encryption Keys Status */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-green-900">Encryption Keys</h3>
            <span className="text-sm text-green-700">
              {encryptionKeys.length} key{encryptionKeys.length !== 1 ? 's' : ''} available
            </span>
          </div>
          
          {encryptionKeys.length === 0 ? (
            <p className="text-green-700 text-sm">
              No encryption keys found. One will be generated automatically when you encrypt content.
            </p>
          ) : (
            <div className="space-y-2">
              {encryptionKeys.map(key => (
                <div key={key.keyId} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">Key: {key.keyId.slice(0, 12)}...</span>
                    <span className="text-green-600 ml-2">({key.algorithm})</span>
                  </div>
                  <span className="text-green-600">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Upload and Encryption */}
        {isCreator && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Encrypt Content</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept="video/*,image/*,audio/*"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-700"
              >
                Choose file to encrypt
              </label>
              
              {selectedFile && (
                <div className="mt-3 text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="mt-4">
                <button
                  onClick={handleEncrypt}
                  disabled={isEncrypting}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isEncrypting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Encrypting... {encryptionProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Encrypt Content</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Encrypted Content Display */}
        {encryptedContent && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Encrypted Content</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Content ID:</span>
                <span className="ml-2 font-mono">{encryptedContent.contentId}</span>
              </div>
              <div>
                <span className="text-gray-600">Original File:</span>
                <span className="ml-2">{encryptedContent.metadata.filename}</span>
              </div>
              <div>
                <span className="text-gray-600">Size:</span>
                <span className="ml-2">{(encryptedContent.metadata.originalSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div>
                <span className="text-gray-600">Encryption Key:</span>
                <span className="ml-2 font-mono">{encryptedContent.encryptionKeyId.slice(0, 12)}...</span>
              </div>
            </div>

            <button
              onClick={handleDecrypt}
              disabled={isDecrypting}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isDecrypting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Decrypting...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Decrypt & Download</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Security Information */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Security Features</h4>
          </div>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• AES-256-GCM encryption with random IV</li>
            <li>• Client-side encryption - keys never leave your device</li>
            <li>• Authenticated encryption prevents tampering</li>
            <li>• Secure key generation using Web Crypto API</li>
            <li>• Content metadata stored on blockchain</li>
          </ul>
        </div>
      </div>
    </div>
  );
};