import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { Lock, Unlock, Shield, Download, Upload, Eye, EyeOff } from 'lucide-react';

interface EncryptedContent {
  id: string;
  title: string;
  encryptedData: string;
  encryptionKey: string;
  accessLevel: 'premium' | 'subscription' | 'nft';
  creatorAddress: string;
  uploadedAt: number;
  fileSize: number;
  mimeType: string;
  isDecrypted: boolean;
  decryptedUrl?: string;
}

interface EncryptionKey {
  id: string;
  contentId: string;
  encryptedKey: string;
  userAddress: string;
  createdAt: number;
  expiresAt?: number;
}

interface EndToEndEncryptionProps {
  contentId?: string;
  isCreator?: boolean;
  className?: string;
}

export const EndToEndEncryption: React.FC<EndToEndEncryptionProps> = ({
  contentId,
  isCreator = false,
  className = ''
}) => {
  const { account, isConnected } = useWallet();
  const { executeTransaction } = useContractManager();
  const [encryptedContent, setEncryptedContent] = useState<EncryptedContent[]>([]);
  const [userKeys, setUserKeys] = useState<EncryptionKey[]>([]);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [showKeys, setShowKeys] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && account) {
      loadEncryptedContent();
      loadUserKeys();
    }
  }, [isConnected, account, contentId]);

  const loadEncryptedContent = async () => {
    try {
      setLoading(true);
      const content = await fetchEncryptedContentFromChain();
      setEncryptedContent(content);
    } catch (error) {
      console.error('Failed to load encrypted content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserKeys = async () => {
    try {
      const keys = await fetchUserKeysFromChain();
      setUserKeys(keys);
    } catch (error) {
      console.error('Failed to load user keys:', error);
    }
  };

  const encryptAndUploadContent = async (file: File, accessLevel: EncryptedContent['accessLevel']) => {
    if (!isConnected || !account || !file) return;

    try {
      setIsEncrypting(true);
      setEncryptionProgress(0);

      // Generate encryption key
      const encryptionKey = await generateEncryptionKey();
      setEncryptionProgress(25);

      // Encrypt file content
      const encryptedData = await encryptFile(file, encryptionKey);
      setEncryptionProgress(50);

      // Upload encrypted data to IPFS/Arweave
      const uploadResult = await uploadEncryptedData(encryptedData);
      setEncryptionProgress(75);

      // Store metadata and encrypted key on blockchain
      await executeTransaction('contentRegistry', 'uploadEncryptedContent', [
        file.name,
        uploadResult.hash,
        encryptionKey.encrypted,
        accessLevel,
        file.size,
        file.type
      ]);

      setEncryptionProgress(100);
      await loadEncryptedContent();
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to encrypt and upload content:', error);
    } finally {
      setIsEncrypting(false);
      setEncryptionProgress(0);
    }
  };

  const decryptContent = async (content: EncryptedContent) => {
    if (!isConnected || !account) return;

    try {
      setIsDecrypting(true);

      // Verify user has access to this content
      const hasAccess = await verifyContentAccess(content);
      if (!hasAccess) {
        alert('You do not have access to this content. Please check your subscription or NFT status.');
        return;
      }

      // Get decryption key
      const decryptionKey = await getDecryptionKey(content.id);
      
      // Decrypt content
      const decryptedData = await decryptData(content.encryptedData, decryptionKey);
      
      // Create blob URL for decrypted content
      const blob = new Blob([decryptedData], { type: content.mimeType });
      const decryptedUrl = URL.createObjectURL(blob);

      // Update content state
      setEncryptedContent(prev => prev.map(c => 
        c.id === content.id 
          ? { ...c, isDecrypted: true, decryptedUrl }
          : c
      ));
    } catch (error) {
      console.error('Failed to decrypt content:', error);
      alert('Failed to decrypt content. Please try again.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const generateEncryptionKey = async () => {
    // Generate AES-256 encryption key
    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Export key for storage
    const exportedKey = await window.crypto.subtle.exportKey('raw', key);
    const keyArray = new Uint8Array(exportedKey);
    
    // Encrypt the key with user's public key (simplified)
    const encryptedKey = await encryptKeyForUser(keyArray);

    return {
      key,
      encrypted: encryptedKey
    };
  };

  const encryptFile = async (file: File, encryptionKey: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const iv = window.crypto.getRandomValues(new Uint8Array(12));
          
          const encryptedData = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            encryptionKey.key,
            arrayBuffer
          );

          // Combine IV and encrypted data
          const combined = new Uint8Array(iv.length + encryptedData.byteLength);
          combined.set(iv);
          combined.set(new Uint8Array(encryptedData), iv.length);

          // Convert to base64 for storage
          const base64 = btoa(String.fromCharCode(...combined));
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const decryptData = async (encryptedBase64: string, decryptionKey: CryptoKey): Promise<ArrayBuffer> => {
    // Convert base64 back to array buffer
    const combined = new Uint8Array(
      atob(encryptedBase64).split('').map(char => char.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Decrypt data
    const decryptedData = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      decryptionKey,
      encryptedData
    );

    return decryptedData;
  };

  const encryptKeyForUser = async (keyArray: Uint8Array): Promise<string> => {
    // Simplified key encryption - in production would use user's public key
    const base64Key = btoa(String.fromCharCode(...keyArray));
    return base64Key;
  };

  const getDecryptionKey = async (contentId: string): Promise<CryptoKey> => {
    // Get encrypted key from user's keys
    const userKey = userKeys.find(k => k.contentId === contentId);
    if (!userKey) {
      throw new Error('Decryption key not found');
    }

    // Decrypt the key (simplified)
    const keyArray = new Uint8Array(
      atob(userKey.encryptedKey).split('').map(char => char.charCodeAt(0))
    );

    // Import key for decryption
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyArray,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    return key;
  };

  const uploadEncryptedData = async (_encryptedData: string) => {
    // Mock upload to IPFS/Arweave
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      hash: 'Qm' + Array(44).fill(0).map(() => Math.floor(Math.random() * 36).toString(36)).join('')
    };
  };

  const verifyContentAccess = async (_content: EncryptedContent): Promise<boolean> => {
    // Mock access verification - would check subscription/NFT status
    return true;
  };

  const fetchEncryptedContentFromChain = async (): Promise<EncryptedContent[]> => {
    // Mock implementation
    return [
      {
        id: '1',
        title: 'Premium Video Content.mp4',
        encryptedData: 'encrypted_data_hash_here',
        encryptionKey: 'encrypted_key_here',
        accessLevel: 'premium',
        creatorAddress: '0x1234...5678',
        uploadedAt: Date.now() / 1000 - 3600,
        fileSize: 52428800, // 50MB
        mimeType: 'video/mp4',
        isDecrypted: false
      }
    ];
  };

  const fetchUserKeysFromChain = async (): Promise<EncryptionKey[]> => {
    // Mock implementation
    return [
      {
        id: '1',
        contentId: '1',
        encryptedKey: 'user_encrypted_key_here',
        userAddress: account || '',
        createdAt: Date.now() / 1000 - 3600
      }
    ];
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const ContentCard: React.FC<{ content: EncryptedContent }> = ({ content }) => (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${content.isDecrypted ? 'bg-green-100' : 'bg-red-100'}`}>
            {content.isDecrypted ? (
              <Unlock className="w-5 h-5 text-green-600" />
            ) : (
              <Lock className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{content.title}</h3>
            <p className="text-sm text-gray-600">
              {formatFileSize(content.fileSize)} • {content.accessLevel}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(content.uploadedAt * 1000).toLocaleDateString()}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Status: {content.isDecrypted ? 'Decrypted' : 'Encrypted'}
        </div>
        
        <div className="flex space-x-2">
          {!content.isDecrypted ? (
            <button
              onClick={() => decryptContent(content)}
              disabled={isDecrypting}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
            >
              <Unlock className="w-4 h-4" />
              <span>Decrypt</span>
            </button>
          ) : (
            <a
              href={content.decryptedUrl}
              download={content.title}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 text-center ${className}`}>
        <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">End-to-End Encryption</h3>
        <p className="text-gray-600">
          Connect your wallet to access encrypted premium content with client-side decryption.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">End-to-End Encryption</h2>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Lock className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900">Client-Side Encryption</h3>
              <p className="text-sm text-green-700 mt-1">
                All premium content is encrypted on your device before upload. Only users with proper access can decrypt and view the content.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section for Creators */}
        {isCreator && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Upload Encrypted Content</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
                accept="video/*,image/*,audio/*"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Click to select file for encryption</p>
                <p className="text-sm text-gray-500">Video, image, or audio files</p>
              </label>
            </div>

            {selectedFile && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Access Level
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900">
                      <option value="premium">Premium (Subscription + NFT)</option>
                      <option value="subscription">Subscription Only</option>
                      <option value="nft">NFT Holders Only</option>
                    </select>
                  </div>

                  <button
                    onClick={() => encryptAndUploadContent(selectedFile, 'premium')}
                    disabled={isEncrypting}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isEncrypting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Encrypting... {encryptionProgress}%</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Encrypt & Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Encrypted Content List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {isCreator ? 'Your Encrypted Content' : 'Available Encrypted Content'}
            </h3>
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
            >
              {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showKeys ? 'Hide' : 'Show'} Keys</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading encrypted content...</p>
            </div>
          ) : encryptedContent.length > 0 ? (
            <div className="space-y-4">
              {encryptedContent.map(content => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No encrypted content available.</p>
              {isCreator && <p className="text-sm">Upload your first encrypted file to get started.</p>}
            </div>
          )}
        </div>

        {/* Encryption Keys (Debug View) */}
        {showKeys && userKeys.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Your Decryption Keys</h4>
            <div className="space-y-2">
              {userKeys.map(key => (
                <div key={key.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Content {key.contentId}:</span>
                  <span className="font-mono text-xs text-gray-800">
                    {key.encryptedKey.slice(0, 20)}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};