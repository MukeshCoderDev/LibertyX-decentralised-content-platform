const { ethers } = require('hardhat');

async function main() {
  console.log('🚀 Starting contract deployment...');
  
  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);

  // Deploy LibertyToken
  const LibertyToken = await ethers.getContractFactory('LibertyToken');
  const libertyToken = await LibertyToken.deploy();
  await libertyToken.waitForDeployment();
  const libertyTokenAddress = await libertyToken.getAddress();
  console.log('LIBERTY:', libertyTokenAddress);

  // Deploy LibertyDAO
  const LibertyDAO = await ethers.getContractFactory('LibertyDAO');
  const libertyDAO = await LibertyDAO.deploy(libertyTokenAddress);
  await libertyDAO.waitForDeployment();
  const libertyDAOAddress = await libertyDAO.getAddress();
  console.log('DAO:', libertyDAOAddress);

  // Deploy all other contracts
  const contracts = {};
  
  // CreatorRegistry
  const CreatorRegistry = await ethers.getContractFactory('CreatorRegistry');
  const creatorRegistry = await CreatorRegistry.deploy();
  await creatorRegistry.waitForDeployment();
  contracts.CreatorRegistry = await creatorRegistry.getAddress();

  // NFTAccess
  const NFTAccess = await ethers.getContractFactory('NFTAccess');
  const nftAccess = await NFTAccess.deploy();
  await nftAccess.waitForDeployment();
  contracts.NFTAccess = await nftAccess.getAddress();

  // SubscriptionManager
  const SubscriptionManager = await ethers.getContractFactory('SubscriptionManager');
  const subscriptionManager = await SubscriptionManager.deploy(libertyTokenAddress);
  await subscriptionManager.waitForDeployment();
  contracts.SubscriptionManager = await subscriptionManager.getAddress();

  // RevenueSplitter
  const RevenueSplitter = await ethers.getContractFactory('RevenueSplitter');
  const revenueSplitter = await RevenueSplitter.deploy();
  await revenueSplitter.waitForDeployment();
  contracts.RevenueSplitter = await revenueSplitter.getAddress();

  // ContentRegistry
  const ContentRegistry = await ethers.getContractFactory('ContentRegistry');
  const contentRegistry = await ContentRegistry.deploy();
  await contentRegistry.waitForDeployment();
  contracts.ContentRegistry = await contentRegistry.getAddress();

  // Add the main tokens
  contracts.LibertyToken = libertyTokenAddress;
  contracts.LibertyDAO = libertyDAOAddress;

  console.table(contracts);
  
  return contracts;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;