import { ethers, Provider } from 'ethers';
import { getContractAddresses } from '../src/config';

export interface ContractHealthStatus {
  isDeployed: boolean;
  isResponding: boolean;
  address: string | null;
  lastChecked: Date;
  error: string | null;
  hasRequiredMethods?: boolean;
}

export interface ContractHealthReport {
  [contractName: string]: ContractHealthStatus;
}

export class ContractHealthChecker {
  private provider: Provider;
  private chainId: number;

  constructor(provider: Provider, chainId: number) {
    this.provider = provider;
    this.chainId = chainId;
  }

  /**
   * Check if a contract is deployed and responding at the given address
   */
  async checkContractAvailability(contractName: string, chainId?: number): Promise<boolean> {
    try {
      const targetChainId = chainId || this.chainId;
      const contractAddresses = getContractAddresses(targetChainId);
      const address = contractAddresses[contractName as keyof typeof contractAddresses];
      
      if (!address || address === '0x0000000000000000000000000000000000000000') {
        console.warn(`No address configured for ${contractName} on chain ${targetChainId}`);
        return false;
      }

      // Check if there's code at the address
      const code = await this.provider.getCode(address);
      const isDeployed = code !== '0x';
      
      console.log(`Contract ${contractName} at ${address}: ${isDeployed ? 'deployed' : 'not deployed'}`);
      return isDeployed;
    } catch (error) {
      console.error(`Error checking availability for ${contractName}:`, error);
      return false;
    }
  }

  /**
   * Validate that a contract has the required methods
   */
  async validateContractMethods(contractName: string, requiredMethods: string[]): Promise<boolean> {
    try {
      const contractAddresses = getContractAddresses(this.chainId);
      const address = contractAddresses[contractName as keyof typeof contractAddresses];
      
      if (!address) {
        return false;
      }

      // For now, we'll assume methods exist if the contract is deployed
      // In a more robust implementation, we could check the ABI
      const isDeployed = await this.checkContractAvailability(contractName);
      
      if (!isDeployed) {
        return false;
      }

      // TODO: Implement actual method validation using contract ABI
      console.log(`Assuming ${contractName} has required methods:`, requiredMethods);
      return true;
    } catch (error) {
      console.error(`Error validating methods for ${contractName}:`, error);
      return false;
    }
  }

  /**
   * Get comprehensive health status for a specific contract
   */
  async getContractStatus(contractName: string): Promise<ContractHealthStatus> {
    const contractAddresses = getContractAddresses(this.chainId);
    const address = contractAddresses[contractName as keyof typeof contractAddresses];
    
    const status: ContractHealthStatus = {
      isDeployed: false,
      isResponding: false,
      address: address || null,
      lastChecked: new Date(),
      error: null,
      hasRequiredMethods: false
    };

    try {
      if (!address || address === '0x0000000000000000000000000000000000000000') {
        status.error = 'No address configured';
        return status;
      }

      // Check deployment
      status.isDeployed = await this.checkContractAvailability(contractName);
      
      if (!status.isDeployed) {
        status.error = 'Contract not deployed at address';
        return status;
      }

      // Check if contract is responding (basic test)
      try {
        const code = await this.provider.getCode(address);
        status.isResponding = code !== '0x';
      } catch (error) {
        status.error = `Contract not responding: ${error}`;
        return status;
      }

      // Validate required methods based on contract type
      const requiredMethods = this.getRequiredMethods(contractName);
      status.hasRequiredMethods = await this.validateContractMethods(contractName, requiredMethods);

      if (!status.hasRequiredMethods) {
        status.error = 'Contract missing required methods';
      }

    } catch (error: any) {
      status.error = error.message || 'Unknown error';
    }

    return status;
  }

  /**
   * Get health status for all contracts on the current chain
   */
  async getAllContractsStatus(): Promise<ContractHealthReport> {
    const contractAddresses = getContractAddresses(this.chainId);
    const report: ContractHealthReport = {};

    const contractNames = Object.keys(contractAddresses);
    
    // Check all contracts in parallel
    const statusPromises = contractNames.map(async (contractName) => {
      const status = await this.getContractStatus(contractName);
      return { contractName, status };
    });

    const results = await Promise.all(statusPromises);
    
    results.forEach(({ contractName, status }) => {
      report[contractName] = status;
    });

    return report;
  }

  /**
   * Get required methods for each contract type
   */
  private getRequiredMethods(contractName: string): string[] {
    const methodMap: { [key: string]: string[] } = {
      subscriptionManager: ['setPlan', 'subscribe', 'isSubscribed', 'plans', 'subs'],
      nftAccess: ['createTier', 'mint', 'balanceOf', 'uri', 'creatorOf'],
      creatorRegistry: ['registerCreator', 'isRegistered', 'getCreator'],
      contentRegistry: ['createContent', 'getContent', 'updateContent'],
      revenueSplitter: ['split', 'withdraw', 'getBalance'],
      libertyToken: ['transfer', 'balanceOf', 'approve'],
      libertyDAO: ['propose', 'vote', 'execute']
    };

    return methodMap[contractName] || [];
  }

  /**
   * Check if critical contracts are available for basic functionality
   */
  async checkCriticalContracts(): Promise<{ available: boolean; missing: string[] }> {
    const criticalContracts = ['subscriptionManager', 'nftAccess', 'creatorRegistry'];
    const missing: string[] = [];

    for (const contractName of criticalContracts) {
      const isAvailable = await this.checkContractAvailability(contractName);
      if (!isAvailable) {
        missing.push(contractName);
      }
    }

    return {
      available: missing.length === 0,
      missing
    };
  }

  /**
   * Perform a quick health check with retry logic
   */
  async quickHealthCheck(maxRetries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { available } = await this.checkCriticalContracts();
        if (available) {
          return true;
        }
        
        if (attempt < maxRetries) {
          console.log(`Health check attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
      } catch (error) {
        console.error(`Health check attempt ${attempt} error:`, error);
        if (attempt === maxRetries) {
          return false;
        }
      }
    }
    
    return false;
  }
}

export default ContractHealthChecker;