import { ethers } from 'hardhat';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface DeploymentConfig {
  network: string;
  chainId: number;
  contracts: {
    [contractName: string]: {
      address: string;
      deploymentTx: string;
      blockNumber: number;
      gasUsed: string;
      constructorArgs: any[];
    };
  };
  deployedAt: string;
  deployer: string;
}

interface ContractDeployment {
  name: string;
  constructorArgs: any[];
  dependencies?: string[];
}

const DEPLOYMENT_ORDER: ContractDeployment[] = [
  {
    name: 'LibertyToken',
    constructorArgs: [],
  },
  {
    name: 'CreatorRegistry',
    constructorArgs: [],
  },
  {
    name: 'ContentRegistry',
    constructorArgs: [],
    dependencies: ['CreatorRegistry'],
  },
  {
    name: 'RevenueSplitter',
    constructorArgs: [],
    dependencies: ['LibertyToken'],
  },
  {
    name: 'SubscriptionManager',
    constructorArgs: [],
    dependencies: ['LibertyToken', 'CreatorRegistry'],
  },
  {
    name: 'NFTAccess',
    constructorArgs: [],
    dependencies: ['LibertyToken', 'CreatorRegistry'],
  },
  {
    name: 'LibertyDAO',
    constructorArgs: [],
    dependencies: ['LibertyToken'],
  },
];

async function deployContract(
  contractName: string,
  constructorArgs: any[],
  deployedContracts: { [name: string]: any }
): Promise<any> {
  console.log(`\n📦 Deploying ${contractName}...`);
  
  // Replace dependency placeholders with actual addresses
  const processedArgs = constructorArgs.map(arg => {
    if (typeof arg === 'string' && arg.startsWith('{{') && arg.endsWith('}}')) {
      const dependencyName = arg.slice(2, -2);
      if (deployedContracts[dependencyName]) {
        return deployedContracts[dependencyName].address;
      }
      throw new Error(`Dependency ${dependencyName} not found for ${contractName}`);
    }
    return arg;
  });

  const ContractFactory = await ethers.getContractFactory(contractName);
  const contract = await ContractFactory.deploy(...processedArgs);
  
  console.log(`⏳ Waiting for deployment transaction...`);
  const deploymentTx = await contract.deployTransaction.wait();
  
  console.log(`✅ ${contractName} deployed to: ${contract.address}`);
  console.log(`📋 Transaction hash: ${deploymentTx.transactionHash}`);
  console.log(`⛽ Gas used: ${deploymentTx.gasUsed.toString()}`);
  
  return {
    contract,
    deploymentTx,
  };
}

async function saveDeploymentInfo(
  network: string,
  chainId: number,
  deployedContracts: { [name: string]: any },
  deployer: string
) {
  const deploymentConfig: DeploymentConfig = {
    network,
    chainId,
    contracts: {},
    deployedAt: new Date().toISOString(),
    deployer,
  };

  for (const [name, info] of Object.entries(deployedContracts)) {
    deploymentConfig.contracts[name] = {
      address: info.contract.address,
      deploymentTx: info.deploymentTx.transactionHash,
      blockNumber: info.deploymentTx.blockNumber,
      gasUsed: info.deploymentTx.gasUsed.toString(),
      constructorArgs: info.constructorArgs || [],
    };
  }

  // Save deployment info
  const deploymentsDir = join(__dirname, '..', 'deployments');
  const networkDir = join(deploymentsDir, network);
  
  // Create directories if they don't exist
  if (!existsSync(deploymentsDir)) {
    require('fs').mkdirSync(deploymentsDir, { recursive: true });
  }
  if (!existsSync(networkDir)) {
    require('fs').mkdirSync(networkDir, { recursive: true });
  }

  // Save individual contract files
  for (const [name, info] of Object.entries(deploymentConfig.contracts)) {
    const contractFile = join(networkDir, `${name}.json`);
    writeFileSync(contractFile, JSON.stringify({
      address: info.address,
      abi: require(`../artifacts/contracts/${getContractFileName(name)}.sol/${name}.json`).abi,
      transactionHash: info.deploymentTx,
      blockNumber: info.blockNumber,
      gasUsed: info.gasUsed,
      constructorArgs: info.constructorArgs,
    }, null, 2));
  }

  // Save deployment summary
  const summaryFile = join(networkDir, 'deployment-summary.json');
  writeFileSync(summaryFile, JSON.stringify(deploymentConfig, null, 2));

  console.log(`\n📄 Deployment info saved to: ${networkDir}`);
}

function getContractFileName(contractName: string): string {
  const fileMap: { [key: string]: string } = {
    'LibertyToken': '01_LibertyToken',
    'CreatorRegistry': '02_CreatorRegistry',
    'ContentRegistry': '03_ContentRegistry',
    'RevenueSplitter': '04_RevenueSplitter',
    'SubscriptionManager': '05_SubscriptionManager',
    'NFTAccess': '06_NFTAccess',
    'LibertyDAO': '07_LibertyDAO',
  };
  return fileMap[contractName] || contractName;
}

async function verifyContracts(
  network: string,
  deployedContracts: { [name: string]: any }
) {
  if (network === 'localhost' || network === 'hardhat') {
    console.log('⚠️  Skipping verification on local network');
    return;
  }

  console.log('\n🔍 Starting contract verification...');
  
  for (const [name, info] of Object.entries(deployedContracts)) {
    try {
      console.log(`\n📋 Verifying ${name}...`);
      
      await require('hardhat').run('verify:verify', {
        address: info.contract.address,
        constructorArguments: info.constructorArgs || [],
      });
      
      console.log(`✅ ${name} verified successfully`);
    } catch (error: any) {
      if (error.message.includes('Already Verified')) {
        console.log(`✅ ${name} already verified`);
      } else {
        console.error(`❌ Failed to verify ${name}:`, error.message);
      }
    }
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log('🚀 Starting multi-contract deployment...');
  console.log(`📡 Network: ${network.name} (${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  const deployedContracts: { [name: string]: any } = {};
  let totalGasUsed = ethers.BigNumber.from(0);

  try {
    // Deploy contracts in order
    for (const deployment of DEPLOYMENT_ORDER) {
      const { contract, deploymentTx } = await deployContract(
        deployment.name,
        deployment.constructorArgs,
        deployedContracts
      );

      deployedContracts[deployment.name] = {
        contract,
        deploymentTx,
        constructorArgs: deployment.constructorArgs,
      };

      totalGasUsed = totalGasUsed.add(deploymentTx.gasUsed);

      // Wait a bit between deployments to avoid nonce issues
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n🎉 All contracts deployed successfully!');
    console.log(`⛽ Total gas used: ${totalGasUsed.toString()}`);

    // Save deployment information
    await saveDeploymentInfo(
      network.name,
      network.chainId,
      deployedContracts,
      deployer.address
    );

    // Verify contracts on Etherscan (if not local network)
    await verifyContracts(network.name, deployedContracts);

    // Print summary
    console.log('\n📋 Deployment Summary:');
    console.log('='.repeat(50));
    for (const [name, info] of Object.entries(deployedContracts)) {
      console.log(`${name}: ${info.contract.address}`);
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main as deployContracts };