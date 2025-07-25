import React, { useState, useRef, useCallback } from 'react';
import { useArweave } from '../hooks/useArweave';
import { useWallet } from '../lib/WalletProvider';
import { ContentMetadata } from '../lib/arweaveConfig';
import Button from './ui/Button';

interface ContentUploadProps {
  onUploadComplete?: (result: { arweaveResult: any; txHash?: string }) => void;
  onCancel?: () => void;
}

const ContentUpload: React.FC<ContentUploadProps> = ({ onUploadComplete, onCancel }) => {
  const { isConnected } = useWallet();
  const {
    isUploading,
    uploadProgress,
    isWaitingConfirmation,
    error,
    uploadAndRegisterContent,
    clearError,
    reset,
  } = useArweave();

  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<Omit<ContentMetadata, 'arweaveId' | 'size' | 'createdAt' | 'contentType'>>({
    title: '',
    description: '',
    price: '0',
    accessLevel: 'public',
    tags: [],
    nftTierRequired: undefined,
    thumbnail: undefined,
    duration: undefined,
  });
  
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation
  const validateFile = (file: File): string | null => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mp3', 'audio/wav', 'audio/ogg',
      'application/pdf',
      'text/plain',
    ];

    if (file.size > maxSize) {
      return 'File size must be less than 100MB';
    }

    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported';
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      alert(validationError);
      return;
    }

    setFile(selectedFile);
    
    // Auto-fill title if empty
    if (!metadata.title) {
      setMetadata(prev => ({
        ...prev,
        title: selectedFile.name.replace(/\.[^/.]+$/, ''), // Remove extension
      }));
    }

    // Set duration for video files (this would need a proper video duration detector)
    if (selectedFile.type.startsWith('video/')) {
      // Placeholder - in real implementation, you'd use a library to get video duration
      setMetadata(prev => ({ ...prev, duration: 0 }));
    }
  }, [metadata.title]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  // Handle metadata changes
  const handleMetadataChange = useCallback((field: string, value: any) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle tags input
  const handleTagsChange = useCallback((tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    handleMetadataChange('tags', tags);
  }, [handleMetadataChange]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    if (!metadata.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!isConnected) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const result = await uploadAndRegisterContent(file, metadata, true);
      
      if (result && onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [file, metadata, isConnected, uploadAndRegisterContent, onUploadComplete]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    reset();
    setFile(null);
    setMetadata({
      title: '',
      description: '',
      price: '0',
      accessLevel: 'public',
      tags: [],
      nftTierRequired: undefined,
      thumbnail: undefined,
      duration: undefined,
    });
    
    if (onCancel) {
      onCancel();
    }
  }, [reset, onCancel]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Content to Arweave</h2>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex justify-between items-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="image/*,video/*,audio/*,.pdf,.txt"
        />
        
        {file ? (
          <div className="space-y-2">
            <div className="text-green-600">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
            <p className="text-sm text-gray-500">{file.type}</p>
            <Button
              onClick={() => setFile(null)}
              className="mt-2 bg-gray-500 hover:bg-gray-600 text-white text-sm px-4 py-1"
            >
              Remove File
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">
              Drop your file here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports images, videos, audio, PDF, and text files (max 100MB)
            </p>
          </div>
        )}
      </div>

      {/* Metadata Form */}
      {file && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => handleMetadataChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter content title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={metadata.description}
              onChange={(e) => handleMetadataChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your content"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={metadata.price}
                onChange={(e) => handleMetadataChange('price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Level
              </label>
              <select
                value={metadata.accessLevel}
                onChange={(e) => handleMetadataChange('accessLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">Public</option>
                <option value="subscription">Subscription Only</option>
                <option value="nft">NFT Holders Only</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>

          {metadata.accessLevel === 'nft' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required NFT Tier
              </label>
              <input
                type="number"
                min="1"
                value={metadata.nftTierRequired || ''}
                onChange={(e) => handleMetadataChange('nftTierRequired', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter NFT tier number"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={metadata.tags.join(', ')}
              onChange={(e) => handleTagsChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="art, digital, nft, crypto"
            />
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {(isUploading || isWaitingConfirmation) && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div className="flex-1">
              {isUploading && uploadProgress && (
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Uploading to Arweave... {uploadProgress.percentage}%
                  </p>
                  <div className="mt-1 bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {isWaitingConfirmation && (
                <p className="text-sm font-medium text-blue-800">
                  Storing metadata on blockchain...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <Button
          onClick={handleCancel}
          className="bg-gray-500 hover:bg-gray-600 text-white"
          disabled={isUploading || isWaitingConfirmation}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || !metadata.title.trim() || isUploading || isWaitingConfirmation || !isConnected}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isUploading || isWaitingConfirmation ? 'Uploading...' : 'Upload to Arweave'}
        </Button>
      </div>

      {/* Connection Warning */}
      {!isConnected && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Please connect your wallet to upload content.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContentUpload;