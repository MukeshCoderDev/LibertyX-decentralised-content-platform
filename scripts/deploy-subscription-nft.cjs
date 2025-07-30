const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log('🚀 Deploying Subscription and NFT contracts to Sepolia...');
  
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  
  console.log(`📡 Network: ${hre.network.name} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH`);
  
  if (balance < hre.ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance for deployment. Need at least 0.01 ETH");
    process.exit(1);
  }

  const deploymentResults = {};
  
  try {
    // Deploy SubscriptionManager
    console.log('\n📄 Deploying SubscriptionManager...');
    const SubscriptionManager = await hre.ethers.getContractFactory("SubscriptionManager");
    const subscriptionManager = await SubscriptionManager.deploy();
    await subscriptionManager.waitForDeployment();
    
    const subscriptionManagerAddress = await subscriptionManager.getAddress();
    console.log(`✅ SubscriptionManager deployed to: ${subscriptionManagerAddress}`);
    console.log(`📋 Transaction hash: ${subscriptionManager.deploymentTransaction().hash}`);
    
    deploymentResults.subscriptionManager = {
      address: subscriptionManagerAddress,
      txHash: subscriptionManager.deploymentTransaction().hash
    };

    // Wait a bit before next deployment
    console.log('⏳ Waiting 10 seconds before next deployment...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Deploy NFTAccess
    console.log('\n📄 Deploying NFTAccess...');
    const NFTAccess = await hre.ethers.getContractFactory("NFTAccess");
    const nftAccess = await NFTAccess.deploy();
    await nftAccess.waitForDeployment();
    
    const nftAccessAddress = await nftAccess.getAddress();
    console.log(`✅ NFTAccess deployed to: ${nftAccessAddress}`);
    console.log(`📋 Transaction hash: ${nftAccess.deploymentTransaction().hash}`);
    
    deploymentResults.nftAccess = {
      address: nftAccessAddress,
      txHash: nftAccess.deploymentTransaction().hash
    };

    // Test basic functionality
    console.log('\n🧪 Testing basic contract functionality...');
    
    // Test SubscriptionManager
    console.log('Testing SubscriptionManager.setPlan...');
    const setPlanTx = await subscriptionManager.setPlan(
      hre.ethers.parseEther("0.01"), // 0.01 ETH
      30 * 24 * 60 * 60 // 30 days in seconds
    );
    await setPlanTx.wait();
    console.log('✅ setPlan test successful');
    
    // Test NFTAccess
    console.log('Testing NFTAccess.createTier...');
    const createTierTx = await nftAccess.createTier(
      "https://example.com/metadata.json",
      1000, // max supply
      hre.ethers.parseEther("0.001") // 0.001 ETH
    );
    await createTierTx.wait();
    console.log('✅ createTier test successful');

    // Save deployment info
    const deploymentData = {
      network: hre.network.name,
      chainId: network.chainId.toString(), // Convert BigInt to string
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deploymentResults
    };

    const deploymentDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentDir, `sepolia-subscription-nft-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log(`\n💾 Deployment data saved to: ${deploymentFile}`);

    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Contract Addresses:');
    console.log(`   SubscriptionManager: ${deploymentResults.subscriptionManager.address}`);
    console.log(`   NFTAccess: ${deploymentResults.nftAccess.address}`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Update src/config.ts with these addresses');
    console.log('2. Verify contracts on Etherscan');
    console.log('3. Test frontend integration');

    return deploymentResults;

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };