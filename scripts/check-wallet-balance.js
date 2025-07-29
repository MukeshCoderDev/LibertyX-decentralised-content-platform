import Arweave from 'arweave';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read wallet key from JSON file
const walletKey = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'arweave-wallet.json'), 'utf8'));

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

async function checkBalance() {
  try {
    console.log('🔍 Checking wallet balance...');
    
    // Get wallet address
    const address = await arweave.wallets.jwkToAddress(walletKey);
    console.log('📍 Wallet Address:', address);
    
    // Get balance
    const balance = await arweave.wallets.getBalance(address);
    const arBalance = arweave.ar.winstonToAr(balance);
    
    console.log('💰 Balance:', arBalance, 'AR');
    
    if (parseFloat(arBalance) > 0) {
      console.log('✅ Wallet has funds! You can upload.');
    } else {
      console.log('❌ Wallet has no funds. You need AR tokens to upload.');
      console.log('💡 Get testnet AR from: https://faucet.arweave.net/');
    }
    
  } catch (error) {
    console.error('❌ Error checking balance:', error.message);
  }
}

checkBalance();