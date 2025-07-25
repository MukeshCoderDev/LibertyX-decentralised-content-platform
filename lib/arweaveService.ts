import { arweave, ArweaveUploadResult, ArweaveUploadProgress, ArweaveError, ContentMetadata, createArweaveTags, checkTransactionStatus } from './arweaveConfig';

export class ArweaveService {
  private uploadProgressCallbacks: Map<string, (progress: ArweaveUploadProgress) => void> = new Map();

  /**
   * Upload file to Arweave with metadata and progress tracking
   */
  async uploadFile(
    file: File,
    metadata: Partial<ContentMetadata>,
    onProgress?: (progress: ArweaveUploadProgress) => void,
    walletKey?: any // JWK wallet key for signing transactions
  ): Promise<ArweaveUploadResult> {
    try {
      console.log('Starting Arweave upload for file:', file.name);
      
      // Validate file
      if (!file || file.size === 0) {
        throw new Error('Invalid file provided');
      }

      // Create transaction
      const data = await this.fileToArrayBuffer(file);
      const transaction = await arweave.createTransaction({ data }, walletKey);

      // Add tags for better organization and searchability
      const tags = createArweaveTags({
        ...metadata,
        contentType: file.type,
        size: file.size,
      });

      tags.forEach(tag => {
        transaction.addTag(tag.name, tag.value);
      });

      // Sign transaction (if wallet key provided)
      if (walletKey) {
        await arweave.transactions.sign(transaction, walletKey);
      }

      // Set up progress tracking
      const uploadId = transaction.id;
      if (onProgress) {
        this.uploadProgressCallbacks.set(uploadId, onProgress);
      }

      // Upload with progress tracking
      const uploader = await arweave.transactions.getUploader(transaction);
      
      while (!uploader.isComplete) {
        await uploader.uploadChunk();
        
        // Report progress
        if (onProgress) {
          const progress: ArweaveUploadProgress = {
            loaded: uploader.uploadedChunks,
            total: uploader.totalChunks,
            percentage: Math.round((uploader.uploadedChunks / uploader.totalChunks) * 100),
          };
          onProgress(progress);
        }
      }

      // Clean up progress callback
      this.uploadProgressCallbacks.delete(uploadId);

      console.log('Arweave upload completed. Transaction ID:', transaction.id);

      return {
        transactionId: transaction.id,
        status: 'pending',
        size: file.size,
        contentType: file.type,
        timestamp: Date.now(),
      };

    } catch (error: any) {
      console.error('Arweave upload failed:', error);
      throw this.createArweaveError('UPLOAD_FAILED', error.message, error);
    }
  }

  /**
   * Upload file using browser wallet (ArConnect)
   */
  async uploadWithBrowserWallet(
    file: File,
    metadata: Partial<ContentMetadata>,
    onProgress?: (progress: ArweaveUploadProgress) => void
  ): Promise<ArweaveUploadResult> {
    try {
      // Check if ArConnect is available
      if (!(window as any).arweaveWallet) {
        throw new Error('ArConnect wallet not found. Please install ArConnect extension.');
      }

      // Connect to ArConnect
      await (window as any).arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION']);

      // Get wallet address
      const address = await (window as any).arweaveWallet.getActiveAddress();
      console.log('Connected to ArConnect wallet:', address);

      // Create transaction
      const data = await this.fileToArrayBuffer(file);
      const transaction = await arweave.createTransaction({ data });

      // Add tags
      const tags = createArweaveTags({
        ...metadata,
        contentType: file.type,
        size: file.size,
      });

      tags.forEach(tag => {
        transaction.addTag(tag.name, tag.value);
      });

      // Sign with ArConnect
      await (window as any).arweaveWallet.sign(transaction);

      // Upload with progress tracking
      const uploader = await arweave.transactions.getUploader(transaction);
      
      while (!uploader.isComplete) {
        await uploader.uploadChunk();
        
        if (onProgress) {
          const progress: ArweaveUploadProgress = {
            loaded: uploader.uploadedChunks,
            total: uploader.totalChunks,
            percentage: Math.round((uploader.uploadedChunks / uploader.totalChunks) * 100),
          };
          onProgress(progress);
        }
      }

      return {
        transactionId: transaction.id,
        status: 'pending',
        size: file.size,
        contentType: file.type,
        timestamp: Date.now(),
      };

    } catch (error: any) {
      console.error('ArConnect upload failed:', error);
      throw this.createArweaveError('ARCONNECT_UPLOAD_FAILED', error.message, error);
    }
  }

  /**
   * Wait for transaction confirmation with timeout
   */
  async waitForConfirmation(
    transactionId: string,
    maxWaitTime: number = 300000, // 5 minutes default
    checkInterval: number = 10000 // 10 seconds default
  ): Promise<'confirmed' | 'timeout' | 'failed'> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await checkTransactionStatus(transactionId);
        
        if (status === 'confirmed') {
          console.log('Transaction confirmed:', transactionId);
          return 'confirmed';
        } else if (status === 'failed') {
          console.log('Transaction failed:', transactionId);
          return 'failed';
        }
        
        // Wait before next check
        await this.sleep(checkInterval);
        
      } catch (error) {
        console.error('Error checking transaction status:', error);
        await this.sleep(checkInterval);
      }
    }
    
    console.log('Transaction confirmation timeout:', transactionId);
    return 'timeout';
  }

  /**
   * Retry upload with exponential backoff
   */
  async uploadWithRetry(
    file: File,
    metadata: Partial<ContentMetadata>,
    maxRetries: number = 3,
    onProgress?: (progress: ArweaveUploadProgress) => void,
    walletKey?: any
  ): Promise<ArweaveUploadResult> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Upload attempt ${attempt}/${maxRetries}`);
        
        const result = walletKey 
          ? await this.uploadFile(file, metadata, onProgress, walletKey)
          : await this.uploadWithBrowserWallet(file, metadata, onProgress);
          
        return result;
        
      } catch (error: any) {
        lastError = error;
        console.error(`Upload attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Get content from Arweave
   */
  async getContent(transactionId: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`https://arweave.net/${transactionId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.statusText}`);
      }
      return await response.arrayBuffer();
    } catch (error: any) {
      console.error('Error fetching Arweave content:', error);
      throw this.createArweaveError('FETCH_FAILED', error.message, error);
    }
  }

  /**
   * Get content URL for direct access
   */
  getContentUrl(transactionId: string): string {
    return `https://arweave.net/${transactionId}`;
  }

  /**
   * Get transaction metadata
   */
  async getTransactionMetadata(transactionId: string): Promise<any> {
    try {
      const transaction = await arweave.transactions.get(transactionId);
      const tags: { [key: string]: string } = {};
      
      transaction.tags.forEach((tag: any) => {
        const key = tag.get('name', { decode: true, string: true });
        const value = tag.get('value', { decode: true, string: true });
        tags[key] = value;
      });
      
      return {
        id: transaction.id,
        owner: transaction.owner,
        target: transaction.target,
        quantity: transaction.quantity,
        reward: transaction.reward,
        data_size: transaction.data_size,
        tags,
      };
    } catch (error: any) {
      console.error('Error fetching transaction metadata:', error);
      throw this.createArweaveError('METADATA_FETCH_FAILED', error.message, error);
    }
  }

  // Helper methods
  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createArweaveError(code: string, message: string, details?: any): ArweaveError {
    return {
      code,
      message,
      details,
    };
  }
}

// Export singleton instance
export const arweaveService = new ArweaveService();