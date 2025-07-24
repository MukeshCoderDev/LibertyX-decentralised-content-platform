import Arweave from 'arweave';
import fs from 'fs';
import path from 'path';

// Initialize Arweave
const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});

// Load wallet from file
function loadWallet() {
    const walletPath = process.env.ARWEAVE_WALLET_PATH || './arweave-wallet.json';
    try {
        const walletData = fs.readFileSync(walletPath, 'utf8');
        return JSON.parse(walletData);
    } catch (error) {
        console.error('Error loading Arweave wallet:', error.message);
        throw error;
    }
}

// Get wallet address
async function getWalletAddress() {
    try {
        const wallet = loadWallet();
        const address = await arweave.wallets.jwkToAddress(wallet);
        return address;
    } catch (error) {
        console.error('Error getting wallet address:', error.message);
        throw error;
    }
}

// Get wallet balance
async function getWalletBalance() {
    try {
        const address = await getWalletAddress();
        const balance = await arweave.wallets.getBalance(address);
        const ar = arweave.ar.winstonToAr(balance);
        return { winston: balance, ar: ar };
    } catch (error) {
        console.error('Error getting wallet balance:', error.message);
        throw error;
    }
}

// Upload data to Arweave
async function uploadData(data, contentType = 'application/json') {
    try {
        const wallet = loadWallet();
        
        const transaction = await arweave.createTransaction({
            data: typeof data === 'string' ? data : JSON.stringify(data)
        }, wallet);
        
        transaction.addTag('Content-Type', contentType);
        transaction.addTag('App-Name', 'LibertyX');
        
        await arweave.transactions.sign(transaction, wallet);
        
        const response = await arweave.transactions.post(transaction);
        
        if (response.status === 200) {
            console.log('Upload successful!');
            console.log('Transaction ID:', transaction.id);
            console.log('Data URL:', `https://arweave.net/${transaction.id}`);
            return transaction.id;
        } else {
            throw new Error(`Upload failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error uploading to Arweave:', error.message);
        throw error;
    }
}

// Main function for testing
async function main() {
    try {
        console.log('🔍 Checking Arweave wallet...');
        
        const address = await getWalletAddress();
        console.log('📍 Wallet Address:', address);
        
        const balance = await getWalletBalance();
        console.log('💰 Balance:', balance.ar, 'AR');
        
        // Test upload (uncomment to test)
        // const testData = { message: 'Hello from LibertyX!', timestamp: Date.now() };
        // const txId = await uploadData(testData);
        // console.log('✅ Test upload completed:', txId);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Export functions for use in other scripts
export {
    loadWallet,
    getWalletAddress,
    getWalletBalance,
    uploadData,
    arweave
};

// Run main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}