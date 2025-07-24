import { getWalletAddress, getWalletBalance } from './arweave-utils.js';

async function testArweave() {
    try {
        console.log('🔍 Testing Arweave wallet setup...');
        
        const address = await getWalletAddress();
        console.log('✅ Wallet Address:', address);
        
        const balance = await getWalletBalance();
        console.log('✅ Balance:', balance.ar, 'AR');
        
        if (parseFloat(balance.ar) > 0) {
            console.log('🎉 Wallet has funds and is ready to use!');
        } else {
            console.log('⚠️  Wallet has no funds. You may need to add AR tokens to upload data.');
            console.log('💡 You can get free AR from: https://faucet.arweave.net/');
        }
        
    } catch (error) {
        console.error('❌ Error testing Arweave:', error.message);
    }
}

testArweave();