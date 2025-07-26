const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// Network configurations
const NETWORKS = {
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    gasPrice: '20000000000', // 20 gwei
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL,
    gasPrice: '30000000000', // 30 gwei
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL,
    gasPrice: '100000000', // 0.1 gwei
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC_URL,
    gasPrice: '1000000000', // 1 gwei
  },
  bsc: {
    name: 'BNB Smart Chain',
    chainId: 56,
    rpcUrl: process.env.BSC_RPC_URL,
    gasPrice: '5000000000', // 5 gwei
  },
  avalanche: {
    name: 'Avalanche C-Chain',
    chainId: 43114,
    rpcUrl: process.env.AVALANCHE_RPC_URL,
    gasPrice: '25000000000', // 25 nAVAX
  },
};

// Contract deployment order
const DEPLOYMENT_ORDER = [
  'LibertyToken',
  'CreatorRegistry',
  'ContentRegistry',
  'RevenueSplitter',
  'SubscriptionManager',
  'NFTAccess',
  'LibertyDAO',
];

class MultiNetworkDeployer {
  constructor() {
    this.deploymentResults = {};
    this.totalGasUsed = {};
    this.deploymentSummary = {
      startTime: Date.now(),
      networks: [],
      contracts: {},
      totalCost: {},
      errors: [],
    };
  }

  async deployToAllNetworks() {
    console.log('🚀 Starting multi-network deployment...');
    console.log('📋 Networks to deploy:', Object.keys(NETWORKS).join(', '));
    console.log('📦 Contracts to deploy:', DEPLOYMENT_ORDER.join(', '));

    for (const [networkKey, networkConfig] of Object.entries(NETWORKS)) {
      try {
        console.log(`\n🌐 Deploying to ${networkConfig.name}...`);
        await this.deployToNetwork(networkKey, networkConfig);
        this.deploymentSummary.networks.push(networkKey);
      } catch (error) {
        console.error(`❌ Failed to deploy to ${networkConfig.name}:`, error.message);
        this.deploymentSummary.errors.push({
          network: networkKey,
          error: error.message,
          timestamp: Date.now(),
        });
      }
    }

    await this.generateDeploymentReport();
    console.log('\n🎉 Multi-network deployment completed!');
  }

  async deployToNetwork(networkKey, networkConfig) {
    // Switch to the network
    await this.switchNetwork(networkConfig);

    const [deployer] = await ethers.getSigners();
    const balance = await deployer.getBalance();
    
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`);

    if (balance.lt(ethers.utils.parseEther('0.1'))) {
      throw new Error(`Insufficient balance for deployment on ${networkConfig.name}`);
    }

    const networkResults = {
      deployer: deployer.address,
      contracts: {},
      gasUsed: ethers.BigNumber.from(0),
      totalCost: ethers.BigNumber.from(0),
    };

    // Deploy contracts in order
    for (const contractName of DEPLOYMENT_ORDER) {
      try {
        console.log(`\n📦 Deploying ${contractName} to ${networkConfig.name}...`);
        
        const result = await this.deployContract(contractName, networkConfig);
        networkResults.contracts[contractName] = result;
        networkResults.gasUsed = networkResults.gasUsed.add(result.gasUsed);
        networkResults.totalCost = networkResults.totalCost.add(result.cost);

        console.log(`✅ ${contractName} deployed: ${result.address}`);
        console.log(`⛽ Gas used: ${result.gasUsed.toString()}`);
        
        // Wait between deployments to avoid nonce issues
        await this.delay(3000);
      } catch (error) {
        console.error(`❌ Failed to deploy ${contractName}:`, error.message);
        throw error;
      }
    }

    this.deploymentResults[networkKey] = networkResults;
    
    console.log(`\n✅ ${networkConfig.name} deployment completed`);
    console.log(`⛽ Total gas used: ${networkResults.gasUsed.toString()}`);
    console.log(`💰 Total cost: ${ethers.utils.formatEther(networkResults.totalCost)} ETH`);

    // Save network-specific deployment info
    await this.saveNetworkDeployment(networkKey, networkConfig, networkResults);
  }

  async deployContract(contractName, networkConfig) {
    const ContractFactory = await ethers.getContractFactory(contractName);
    
    // Set gas price for the network
    const gasPrice = networkConfig.gasPrice;
    
    const contract = await ContractFactory.deploy({
      gasPrice: gasPrice,
    });

    const deploymentTx = await contract.deployTransaction.wait();
    const cost = deploymentTx.gasUsed.mul(gasPrice);

    return {
      address: contract.address,
      transactionHash: deploymentTx.transactionHash,
      blockNumber: deploymentTx.blockNumber,
      gasUsed: deploymentTx.gasUsed,
      gasPrice: gasPrice,
      cost: cost,
    };
  }

  async switchNetwork(networkConfig) {
    // In a real implementation, this would switch the provider
    // For now, we'll just log the network switch
    console.log(`🔄 Switching to ${networkConfig.name} (Chain ID: ${networkConfig.chainId})`);
  }

  async saveNetworkDeployment(networkKey, networkConfig, results) {
    const deploymentDir = path.join(__dirname, '..', 'deployments', networkKey);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    // Save deployment summary
    const deploymentInfo = {
      network: networkConfig.name,
      chainId: networkConfig.chainId,
      deployer: results.deployer,
      deployedAt: new Date().toISOString(),
      contracts: {},
      totalGasUsed: results.gasUsed.toString(),
      totalCost: ethers.utils.formatEther(results.totalCost),
    };

    // Add contract details
    for (const [contractName, contractInfo] of Object.entries(results.contracts)) {
      deploymentInfo.contracts[contractName] = {
        address: contractInfo.address,
        transactionHash: contractInfo.transactionHash,
        blockNumber: contractInfo.blockNumber,
        gasUsed: contractInfo.gasUsed.toString(),
        gasPrice: contractInfo.gasPrice,
      };

      // Save individual contract file
      const contractFile = path.join(deploymentDir, `${contractName}.json`);
      const contractData = {
        address: contractInfo.address,
        abi: this.getContractABI(contractName),
        transactionHash: contractInfo.transactionHash,
        blockNumber: contractInfo.blockNumber,
        gasUsed: contractInfo.gasUsed.toString(),
        network: networkConfig.name,
        chainId: networkConfig.chainId,
      };
      
      fs.writeFileSync(contractFile, JSON.stringify(contractData, null, 2));
    }

    // Save network summary
    const summaryFile = path.join(deploymentDir, 'deployment-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(deploymentInfo, null, 2));

    console.log(`📄 Deployment info saved to: ${deploymentDir}`);
  }

  async generateDeploymentReport() {
    this.deploymentSummary.endTime = Date.now();
    this.deploymentSummary.duration = this.deploymentSummary.endTime - this.deploymentSummary.startTime;

    // Calculate totals
    let totalGasUsed = ethers.BigNumber.from(0);
    let totalCostETH = ethers.BigNumber.from(0);

    for (const [networkKey, results] of Object.entries(this.deploymentResults)) {
      totalGasUsed = totalGasUsed.add(results.gasUsed);
      totalCostETH = totalCostETH.add(results.totalCost);
      
      this.deploymentSummary.totalCost[networkKey] = ethers.utils.formatEther(results.totalCost);
    }

    // Generate comprehensive report
    const report = {
      ...this.deploymentSummary,
      totalGasUsed: totalGasUsed.toString(),
      totalCostETH: ethers.utils.formatEther(totalCostETH),
      successfulNetworks: this.deploymentSummary.networks.length,
      failedNetworks: this.deploymentSummary.errors.length,
      contractsDeployed: DEPLOYMENT_ORDER.length * this.deploymentSummary.networks.length,
    };

    // Save master deployment report
    const reportDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportFile = path.join(reportDir, `deployment-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    // Generate human-readable summary
    const summaryFile = path.join(reportDir, 'latest-deployment-summary.md');
    const summaryContent = this.generateMarkdownSummary(report);
    fs.writeFileSync(summaryFile, summaryContent);

    console.log('\n📊 Deployment Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successful networks: ${report.successfulNetworks}`);
    console.log(`❌ Failed networks: ${report.failedNetworks}`);
    console.log(`📦 Total contracts deployed: ${report.contractsDeployed}`);
    console.log(`⛽ Total gas used: ${report.totalGasUsed}`);
    console.log(`💰 Total cost: ${report.totalCostETH} ETH`);
    console.log(`⏱️  Duration: ${Math.round(report.duration / 1000)}s`);
    console.log('='.repeat(60));

    if (report.failedNetworks > 0) {
      console.log('\n❌ Deployment Errors:');
      report.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.network}: ${error.error}`);
      });
    }

    console.log(`\n📄 Full report saved to: ${reportFile}`);
  }

  generateMarkdownSummary(report) {
    const date = new Date(report.startTime).toISOString();
    
    let markdown = `# Multi-Network Deployment Report\n\n`;
    markdown += `**Date:** ${date}\n`;
    markdown += `**Duration:** ${Math.round(report.duration / 1000)} seconds\n`;
    markdown += `**Total Cost:** ${report.totalCostETH} ETH\n\n`;

    markdown += `## Summary\n\n`;
    markdown += `- ✅ Successful networks: ${report.successfulNetworks}\n`;
    markdown += `- ❌ Failed networks: ${report.failedNetworks}\n`;
    markdown += `- 📦 Total contracts deployed: ${report.contractsDeployed}\n`;
    markdown += `- ⛽ Total gas used: ${report.totalGasUsed}\n\n`;

    if (report.networks.length > 0) {
      markdown += `## Successful Deployments\n\n`;
      report.networks.forEach(network => {
        const results = this.deploymentResults[network];
        markdown += `### ${NETWORKS[network].name}\n`;
        markdown += `- **Deployer:** ${results.deployer}\n`;
        markdown += `- **Gas Used:** ${results.gasUsed.toString()}\n`;
        markdown += `- **Cost:** ${ethers.utils.formatEther(results.totalCost)} ETH\n`;
        markdown += `- **Contracts:**\n`;
        
        Object.entries(results.contracts).forEach(([name, info]) => {
          markdown += `  - ${name}: \`${info.address}\`\n`;
        });
        markdown += `\n`;
      });
    }

    if (report.errors.length > 0) {
      markdown += `## Failed Deployments\n\n`;
      report.errors.forEach((error, index) => {
        markdown += `${index + 1}. **${error.network}:** ${error.error}\n`;
      });
    }

    return markdown;
  }

  getContractABI(contractName) {
    try {
      const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', `${this.getContractFileName(contractName)}.sol`, `${contractName}.json`);
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      return artifact.abi;
    } catch (error) {
      console.warn(`Could not load ABI for ${contractName}`);
      return [];
    }
  }

  getContractFileName(contractName) {
    const fileMap = {
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const deployer = new MultiNetworkDeployer();
  await deployer.deployToAllNetworks();
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { MultiNetworkDeployer };