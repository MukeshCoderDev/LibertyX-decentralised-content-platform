import hre from 'hardhat';
const { ethers } = hre;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multi-network deployment script
async function deployContracts() {
  console.log('🚀 Starting multi-network contract deployment...');
  
  const network = hre.network.name;
  console.log(`📡 Deploying to network: ${network}`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deploying with account: ${deployer.address}`);
  console.log(`💰 Account balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  const deploymentResults = {};
  
  try {
    // 1. Deploy LibertyToken
    console.log('\n📄 Deploying LibertyToken...');
    const LibertyToken = await ethers.getContractFactory('LibertyToken');
    const libertyToken = await LibertyToken.deploy();
    await libertyToken.deployed();
    console.log(`✅ LibertyToken deployed to: ${libertyToken.address}`);
    deploymentResults.libertyToken = libertyToken.address;

    // 2. Deploy CreatorRegistry
    console.log('\n📄 Deploying CreatorRegistry...');
    const CreatorRegistry = await ethers.getContractFactory('CreatorRegistry');
    const creatorRegistry = await CreatorRegistry.deploy();
    await creatorRegistry.deployed();
    console.log(`✅ CreatorRegistry deployed to: ${creatorRegistry.address}`);
    deploymentResults.creatorRegistry = creatorRegistry.address;

    // 3. Deploy ContentRegistry
    console.log('\n📄 Deploying ContentRegistry...');
    const ContentRegistry = await ethers.getContractFactory('ContentRegistry');
    const contentRegistry = await ContentRegistry.deploy();
    await contentRegistry.deployed();
    console.log(`✅ ContentRegistry deployed to: ${contentRegistry.address}`);
    deploymentResults.contentRegistry = contentRegistry.address;

    // 4. Deploy RevenueSplitter
    console.log('\n📄 Deploying RevenueSplitter...');
    const RevenueSplitter = await ethers.getContractFactory('RevenueSplitter');
    const revenueSplitter = await RevenueSplitter.deploy();
    await revenueSplitter.deployed();
    console.log(`✅ RevenueSplitter deployed to: ${revenueSplitter.address}`);
    deploymentResults.revenueSplitter = revenueSplitter.address;

    // 5. Deploy SubscriptionManager
    console.log('\n📄 Deploying SubscriptionManager...');
    const SubscriptionManager = await ethers.getContractFactory('SubscriptionManager');
    const subscriptionManager = await SubscriptionManager.deploy(libertyToken.address);
    await subscriptionManager.deployed();
    console.log(`✅ SubscriptionManager deployed to: ${subscriptionManager.address}`);
    deploymentResults.subscriptionManager = subscriptionManager.address;

    // 6. Deploy NFTAccess
    console.log('\n📄 Deploying NFTAccess...');
    const NFTAccess = await ethers.getContractFactory('NFTAccess');
    const nftAccess = await NFTAccess.deploy();
    await nftAccess.deployed();
    console.log(`✅ NFTAccess deployed to: ${nftAccess.address}`);
    deploymentResults.nftAccess = nftAccess.address;

    // 7. Deploy LibertyDAO
    console.log('\n📄 Deploying LibertyDAO...');
    const LibertyDAO = await ethers.getContractFactory('LibertyDAO');
    const libertyDAO = await LibertyDAO.deploy(libertyToken.address);
    await libertyDAO.deployed();
    console.log(`✅ LibertyDAO deployed to: ${libertyDAO.address}`);
    deploymentResults.libertyDAO = libertyDAO.address;

    // Save deployment results
    const deploymentData = {
      network: network,
      chainId: (await ethers.provider.getNetwork()).chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deploymentResults,
      gasUsed: {
        // Gas tracking would be implemented here
      }
    };

    const deploymentDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentDir, `${network}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log(`\n💾 Deployment data saved to: ${deploymentFile}`);

    // Update environment config
    updateEnvironmentConfig(network, deploymentResults);

    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Deployment Summary:');
    Object.entries(deploymentResults).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });

    // Verify contracts on Etherscan (if not local network)
    if (network !== 'hardhat' && network !== 'localhost') {
      console.log('\n🔍 Starting contract verification...');
      await verifyContracts(deploymentResults);
    }

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

async function verifyContracts(contracts) {
  for (const [name, address] of Object.entries(contracts)) {
    try {
      console.log(`🔍 Verifying ${name} at ${address}...`);
      await hre.run('verify:verify', {
        address: address,
        constructorArguments: getConstructorArgs(name, contracts),
      });
      console.log(`✅ ${name} verified successfully`);
    } catch (error) {
      console.log(`⚠️  ${name} verification failed:`, error.message);
    }
  }
}

function getConstructorArgs(contractName, contracts) {
  switch (contractName) {
    case 'subscriptionManager':
      return [contracts.libertyToken];
    case 'libertyDAO':
      return [contracts.libertyToken];
    default:
      return [];
  }
}

function updateEnvironmentConfig(network, contracts) {
  try {
    const configPath = path.join(__dirname, '..', 'config', 'environments.ts');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // This is a simplified update - in production, you'd want more robust config management
    console.log(`📝 Environment config would be updated for ${network}`);
    console.log('   Contract addresses:', contracts);
    
  } catch (error) {
    console.log('⚠️  Could not update environment config:', error.message);
  }
}

// Run deployment
deployContracts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { deployContracts };