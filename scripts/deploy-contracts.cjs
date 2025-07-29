const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Multi-network deployment script
async function deployContracts() {
  console.log('🚀 Starting multi-network contract deployment...');
  
  const network = hre.network.name;
  console.log(`📡 Deploying to network: ${network}`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deploying with account: ${deployer.address}`);
  console.log(`💰 Account balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);

  const deploymentResults = {};
  
  try {
    // 1. Deploy LibertyToken
    console.log('\n📄 Deploying LibertyToken...');
    const LibertyToken = await ethers.getContractFactory('LibertyToken');
    const libertyToken = await LibertyToken.deploy();
    await libertyToken.waitForDeployment();
    const libertyTokenAddress = await libertyToken.getAddress();
    console.log(`✅ LibertyToken deployed to: ${libertyTokenAddress}`);
    deploymentResults.libertyToken = libertyTokenAddress;

    // 2. Deploy CreatorRegistry
    console.log('\n📄 Deploying CreatorRegistry...');
    const CreatorRegistry = await ethers.getContractFactory('CreatorRegistry');
    const creatorRegistry = await CreatorRegistry.deploy();
    await creatorRegistry.waitForDeployment();
    const creatorRegistryAddress = await creatorRegistry.getAddress();
    console.log(`✅ CreatorRegistry deployed to: ${creatorRegistryAddress}`);
    deploymentResults.creatorRegistry = creatorRegistryAddress;

    // 3. Deploy ContentRegistry
    console.log('\n📄 Deploying ContentRegistry...');
    const ContentRegistry = await ethers.getContractFactory('ContentRegistry');
    const contentRegistry = await ContentRegistry.deploy();
    await contentRegistry.waitForDeployment();
    const contentRegistryAddress = await contentRegistry.getAddress();
    console.log(`✅ ContentRegistry deployed to: ${contentRegistryAddress}`);
    deploymentResults.contentRegistry = contentRegistryAddress;

    // 4. Deploy RevenueSplitter
    console.log('\n📄 Deploying RevenueSplitter...');
    const RevenueSplitter = await ethers.getContractFactory('RevenueSplitter');
    const revenueSplitter = await RevenueSplitter.deploy();
    await revenueSplitter.waitForDeployment();
    const revenueSplitterAddress = await revenueSplitter.getAddress();
    console.log(`✅ RevenueSplitter deployed to: ${revenueSplitterAddress}`);
    deploymentResults.revenueSplitter = revenueSplitterAddress;

    // 5. Deploy SubscriptionManager
    console.log('\n📄 Deploying SubscriptionManager...');
    const SubscriptionManager = await ethers.getContractFactory('SubscriptionManager');
    const subscriptionManager = await SubscriptionManager.deploy(libertyTokenAddress);
    await subscriptionManager.waitForDeployment();
    const subscriptionManagerAddress = await subscriptionManager.getAddress();
    console.log(`✅ SubscriptionManager deployed to: ${subscriptionManagerAddress}`);
    deploymentResults.subscriptionManager = subscriptionManagerAddress;

    // 6. Deploy NFTAccess
    console.log('\n📄 Deploying NFTAccess...');
    const NFTAccess = await ethers.getContractFactory('NFTAccess');
    const nftAccess = await NFTAccess.deploy();
    await nftAccess.waitForDeployment();
    const nftAccessAddress = await nftAccess.getAddress();
    console.log(`✅ NFTAccess deployed to: ${nftAccessAddress}`);
    deploymentResults.nftAccess = nftAccessAddress;

    // 7. Deploy LibertyDAO
    console.log('\n📄 Deploying LibertyDAO...');
    const LibertyDAO = await ethers.getContractFactory('LibertyDAO');
    const libertyDAO = await LibertyDAO.deploy(libertyTokenAddress);
    await libertyDAO.waitForDeployment();
    const libertyDAOAddress = await libertyDAO.getAddress();
    console.log(`✅ LibertyDAO deployed to: ${libertyDAOAddress}`);
    deploymentResults.libertyDAO = libertyDAOAddress;

    // Save deployment results
    const deploymentData = {
      network: network,
      chainId: (await ethers.provider.getNetwork()).chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deploymentResults,
    };

    const deploymentDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentDir, `${network}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log(`\n💾 Deployment data saved to: ${deploymentFile}`);

    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Deployment Summary:');
    Object.entries(deploymentResults).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });

    console.log('\n📝 Next steps:');
    console.log('1. Update your blockchainConfig.ts with these new addresses');
    console.log('2. Add these addresses to your .env file if needed');
    console.log('3. Restart your development server');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deployContracts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployContracts };