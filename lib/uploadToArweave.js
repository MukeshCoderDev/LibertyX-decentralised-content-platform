import Arweave from 'arweave';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

export async function uploadVideo(buffer, contentType, wallet, metadata = {}) {
  try {
    console.log('🚀 Starting Arweave upload with creator wallet...');
    
    if (!wallet) {
      throw new Error('Wallet is required for upload');
    }
    
    // Create transaction
    const tx = await arweave.createTransaction({ data: buffer }, wallet);
    
    // Add essential tags
    tx.addTag('Content-Type', contentType);
    tx.addTag('App-Name', 'LibertyX');
    tx.addTag('App-Version', '1.0.0');
    tx.addTag('Creator-Funded', 'true'); // Mark as creator-funded
    
    // Add metadata tags if provided
    if (metadata.title) tx.addTag('Title', metadata.title);
    if (metadata.description) tx.addTag('Description', metadata.description);
    if (metadata.accessLevel) tx.addTag('Access-Level', metadata.accessLevel);
    
    // Sign transaction with creator's wallet
    await arweave.transactions.sign(tx, wallet);
    
    // Post transaction
    await arweave.transactions.post(tx);
    
    console.log('✅ Creator-funded upload complete! Transaction ID:', tx.id);
    
    return {
      transactionId: tx.id,
      status: 'pending',
      url: `https://arweave.net/${tx.id}`
    };
    
  } catch (error) {
    console.error('❌ Creator-funded upload failed:', error);
    
    // Provide helpful error messages
    if (error.message.includes('insufficient')) {
      throw new Error('Insufficient funds in wallet. Please add more AR tokens to your wallet.');
    } else if (error.message.includes('network')) {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
}

// Estimate upload cost
export async function estimateUploadCost(fileSize) {
  try {
    const costWinston = await arweave.transactions.getPrice(fileSize);
    const costAR = arweave.ar.winstonToAr(costWinston);
    return costAR;
  } catch (error) {
    console.error('Failed to estimate cost:', error);
    throw new Error('Unable to estimate upload cost');
  }
}