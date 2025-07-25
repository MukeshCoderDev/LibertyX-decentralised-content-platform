import { useState, useCallback } from 'react';
import { arweaveService } from '../lib/arweaveService';
import { ArweaveUploadResult, ArweaveUploadProgress, ContentMetadata } from '../lib/arweaveConfig';
import { useContractManager } from './useContractManager';

interface ArweaveState {
  isUploading: boolean;
  uploadProgress: ArweaveUploadProgress | null;
  uploadResult: ArweaveUploadResult | null;
  isWaitingConfirmation: boolean;
  error: string | null;
}

export const useArweave = () => {
  const [state, setState] = useState<ArweaveState>({
    isUploading: false,
    uploadProgress: null,
    uploadResult: null,
    isWaitingConfirmation: false,
    error: null,
  });

  const contractManager = useContractManager();

  const updateState = useCallback((updates: Partial<ArweaveState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Upload content to Arweave and store metadata on-chain
   */
  const uploadContent = useCallback(async (
    file: File,
    metadata: Partial<ContentMetadata>,
    useWallet: boolean = true
  ): Promise<ArweaveUploadResult | null> => {
    try {
      updateState({
        isUploading: true,
        uploadProgress: null,
        uploadResult: null,
        error: null,
      });

      console.log('Starting content upload to Arweave...');

      // Progress callback
      const onProgress = (progress: ArweaveUploadProgress) => {
        updateState({ uploadProgress: progress });
      };

      // Upload to Arweave with retry logic
      const result = useWallet
        ? await arweaveService.uploadWithBrowserWallet(file, metadata, onProgress)
        : await arweaveService.uploadWithRetry(file, metadata, 3, onProgress);

      updateState({
        uploadResult: result,
        isUploading: false,
        uploadProgress: { loaded: 100, total: 100, percentage: 100 },
      });

      console.log('Arweave upload completed:', result);
      return result;

    } catch (error: any) {
      console.error('Content upload failed:', error);
      updateState({
        isUploading: false,
        error: error.message || 'Upload failed',
      });
      return null;
    }
  }, [updateState]);

  /**
   * Upload content and store metadata on-chain in one flow
   */
  const uploadAndRegisterContent = useCallback(async (
    file: File,
    metadata: Omit<ContentMetadata, 'arweaveId' | 'size' | 'createdAt'>,
    useWallet: boolean = true
  ): Promise<{ arweaveResult: ArweaveUploadResult; txHash?: string } | null> => {
    try {
      updateState({
        isUploading: true,
        uploadProgress: null,
        uploadResult: null,
        error: null,
      });

      // Step 1: Upload to Arweave
      console.log('Step 1: Uploading to Arweave...');
      const arweaveResult = await uploadContent(file, metadata, useWallet);
      
      if (!arweaveResult) {
        throw new Error('Arweave upload failed');
      }

      // Step 2: Wait for Arweave confirmation (optional, can be done in background)
      updateState({ isWaitingConfirmation: true });
      console.log('Step 2: Waiting for Arweave confirmation...');
      
      // Don't wait for full confirmation, proceed with on-chain storage
      // The confirmation can happen in the background
      
      // Step 3: Store metadata on-chain
      console.log('Step 3: Storing metadata on-chain...');
      const contentRegistry = contractManager.contracts.contentRegistry;
      
      if (!contentRegistry) {
        throw new Error('ContentRegistry contract not available');
      }

      // Prepare metadata for on-chain storage
      const onChainMetadata: ContentMetadata = {
        ...metadata,
        arweaveId: arweaveResult.transactionId,
        size: file.size,
        createdAt: Date.now(),
        contentType: file.type,
      };

      // Call ContentRegistry contract
      const txResult = await contractManager.executeTransaction(
        'contentRegistry',
        'registerContent',
        [
          onChainMetadata.arweaveId,
          onChainMetadata.title,
          onChainMetadata.description,
          onChainMetadata.contentType,
          onChainMetadata.size.toString(),
          onChainMetadata.price,
          onChainMetadata.accessLevel,
          onChainMetadata.nftTierRequired || 0,
          onChainMetadata.tags.join(','),
          onChainMetadata.thumbnail || '',
          onChainMetadata.duration || 0,
        ]
      );

      updateState({
        isUploading: false,
        isWaitingConfirmation: false,
      });

      console.log('Content registration completed:', {
        arweave: arweaveResult.transactionId,
        blockchain: txResult.hash,
      });

      return {
        arweaveResult,
        txHash: txResult.hash,
      };

    } catch (error: any) {
      console.error('Content upload and registration failed:', error);
      updateState({
        isUploading: false,
        isWaitingConfirmation: false,
        error: error.message || 'Upload and registration failed',
      });
      return null;
    }
  }, [uploadContent, contractManager, updateState]);

  /**
   * Check Arweave transaction status
   */
  const checkTransactionStatus = useCallback(async (transactionId: string) => {
    try {
      const status = await arweaveService.waitForConfirmation(transactionId, 60000, 5000);
      return status;
    } catch (error: any) {
      console.error('Error checking transaction status:', error);
      return 'failed';
    }
  }, []);

  /**
   * Get content URL for display
   */
  const getContentUrl = useCallback((transactionId: string) => {
    return arweaveService.getContentUrl(transactionId);
  }, []);

  /**
   * Get content metadata from Arweave
   */
  const getContentMetadata = useCallback(async (transactionId: string) => {
    try {
      return await arweaveService.getTransactionMetadata(transactionId);
    } catch (error: any) {
      console.error('Error fetching content metadata:', error);
      return null;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setState({
      isUploading: false,
      uploadProgress: null,
      uploadResult: null,
      isWaitingConfirmation: false,
      error: null,
    });
  }, []);

  return {
    // State
    isUploading: state.isUploading,
    uploadProgress: state.uploadProgress,
    uploadResult: state.uploadResult,
    isWaitingConfirmation: state.isWaitingConfirmation,
    error: state.error,

    // Actions
    uploadContent,
    uploadAndRegisterContent,
    checkTransactionStatus,
    getContentUrl,
    getContentMetadata,
    clearError,
    reset,
  };
};