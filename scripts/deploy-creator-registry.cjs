const { ethers } = require('hardhat');

async function deployCreatorRegistry() {
  console.log('🚀 Deploying CreatorRegistry to Sepolia...');
  
  const [deployer] = await ethers.getSigners();
  console.log('👤 Deploying with account:', deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('💰 Account balance:', ethers.formatEther(balance), 'ETH');
  
  if (balance < ethers.parseEther('0.01')) {
    console.log('⚠️  Low balance! You may need more ETH for deployment.');
    console.log('🚰 Get test ETH from: https://sepoliafaucet.com');
  }

  try {
    // Deploy CreatorRegistry
    console.log('\n📄 Deploying CreatorRegistry...');
    const CreatorRegistry = await ethers.getContractFactory('CreatorRegistry');
    const creatorRegistry = await CreatorRegistry.deploy();
    
    console.log('⏳ Waiting for deployment...');
    await creatorRegistry.waitForDeployment();
    
    const address = await creatorRegistry.getAddress();
    console.log('✅ CreatorRegistry deployed to:', address);
    
    // Verify the contract is working
    console.log('\n🔍 Verifying contract...');
    const deployerAddress = await deployer.getAddress();
    console.log('Testing contract call...');
    
    // Test a simple read call
    try {
      const creator = await creatorRegistry.creators(deployerAddress);
      console.log('✅ Contract is accessible and working!');
      console.log('Creator data for deployer:', {
        handle: creator.handle,
        avatarURI: creator.avatarURI,
        bio: creator.bio,
        kycVerified: creator.kycVerified,
        isBanned: creator.isBanned,
        earned: creator.earned.toString()
      });
    } catch (error) {
      console.log('⚠️  Contract deployed but read test failed:', error.message);
    }
    
    console.log('\n📋 DEPLOYMENT SUMMARY:');
    console.log('='.repeat(50));
    console.log('Network: Sepolia Testnet');
    console.log('Contract: CreatorRegistry');
    console.log('Address:', address);
    console.log('Deployer:', deployer.address);
    console.log('Transaction Hash: (check your wallet)');
    console.log('='.repeat(50));
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Copy this address:', address);
    console.log('2. Update src/config.ts sepolia.creatorRegistry with this address');
    console.log('3. Restart your development server');
    console.log('4. Test creator registration and profile loading');
    
    return address;
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log('\n💡 Solution: Get more test ETH from https://sepoliafaucet.com');
    } else if (error.code === 'NETWORK_ERROR') {
      console.log('\n💡 Solution: Check your internet connection and RPC URL');
    } else {
      console.log('\n💡 Check the error details above and try again');
    }
    
    throw error;
  }
}

// Run deployment
if (require.main === module) {
  deployCreatorRegistry()
    .then((address) => {
      console.log('\n🎉 Deployment completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Deployment failed:', error.message);
      process.exit(1);
    });
}

module.exports = { deployCreatorRegistry };