import { ethers, Signer, Provider } from 'ethers';
import { Chain, TransactionResult, ContractManager as IContractManager } from './web3-types';
import { getContractInstance } from './contractUtils';
import { getChainByChainId } from './blockchainConfig';
import { getContractAddresses } from '../src/config';
import ContractHealthChecker, { ContractHealthReport } from './ContractHealthChecker';

class ContractManager implements IContractManager {
  public contracts: IContractManager['contracts'] = {
    libertyToken: null,
    creatorRegistry: null,
    contentRegistry: null,
    revenueSplitter: null,
    subscriptionManager: null,
    nftAccess: null,
    libertyDAO: null,
  };

  public provider: Provider | null = null;
  public signer: Signer | null = null;
  public currentChainId: number | null = null;
  public healthChecker: ContractHealthChecker | null = null;
  public lastHealthReport: ContractHealthReport | null = null;

  constructor(signerOrProvider: Signer | Provider, chainId: number) {
    this.setSignerOrProvider(signerOrProvider, chainId);
  }

  public setSignerOrProvider(signerOrProvider: Signer | Provider, chainId: number) {
    if ((signerOrProvider as Signer).getAddress) { // Check if it's a Signer
      this.signer = signerOrProvider as Signer;
      this.provider = signerOrProvider.provider || null;
    } else {
      this.provider = signerOrProvider as Provider;
      this.signer = null;
    }
    this.currentChainId = chainId;
    
    // Initialize health checker
    if (this.provider) {
      this.healthChecker = new ContractHealthChecker(this.provider, chainId);
    }
    
    // Initialize contracts asynchronously
    this.initializeContracts().catch(error => {
      console.error('Failed to initialize contracts:', error);
    });
  }

  private async initializeContracts() {
    if (!this.currentChainId || !this.provider) {
      console.warn('Cannot initialize contracts: chainId or provider is missing.');
      return;
    }

    // Perform health check first
    if (this.healthChecker) {
      console.log('🔍 Performing contract health check...');
      try {
        this.lastHealthReport = await this.healthChecker.getAllContractsStatus();
        console.log('📊 Contract health report:', this.lastHealthReport);
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }

    // Use hardcoded addresses from config for reliability
    const contractAddresses = getContractAddresses(this.currentChainId);
    console.log('Using contract addresses for chain', this.currentChainId, ':', contractAddresses);

    const chain = getChainByChainId(this.currentChainId);
    if (!chain) {
      console.error(`Chain with ID ${this.currentChainId} not found.`);
      return;
    }

    // Override chain contracts with our hardcoded addresses
    const updatedChain = {
      ...chain,
      contracts: contractAddresses
    };

    for (const contractName in updatedChain.contracts) {
      if (updatedChain.contracts.hasOwnProperty(contractName)) {
        try {
          // Check if contract is healthy before initializing
          const contractHealth = this.lastHealthReport?.[contractName];
          if (contractHealth && !contractHealth.isDeployed) {
            console.warn(`⚠️ Skipping ${contractName} - not deployed at ${contractHealth.address}`);
            continue;
          }

          const contractInstance = getContractInstance(
            contractName as keyof Chain['contracts'],
            this.currentChainId,
            (this.signer || this.provider)! // Assert non-null as we checked above
          );
          if (contractInstance) {
            this.contracts[contractName as keyof IContractManager['contracts']] = contractInstance;
            console.log(`✅ ${contractName} contract initialized at:`, contractInstance.target);
          } else {
            console.warn(`⚠️ Failed to initialize ${contractName} contract`);
          }
        } catch (error) {
          console.error(`❌ Error initializing ${contractName}:`, error);
          // Continue with other contracts instead of failing completely
        }
      }
    }
    console.log('Contracts initialized for chain:', this.currentChainId);
  }

  public getContract(contractName: keyof Chain['contracts'], chainId: number): any {
    if (this.currentChainId !== chainId) {
      console.warn(`Requested contract for chain ${chainId}, but current manager is for chain ${this.currentChainId}. Re-initializing.`);
      const chain = getChainByChainId(chainId);
      if (!chain) {
        console.error(`Chain with ID ${chainId} not found.`);
        return null;
      }
      return getContractInstance(contractName, chainId, (this.signer || this.provider)!);
    }
    
    const contract = this.contracts[contractName];
    if (!contract) {
      console.error(`Contract ${contractName} not initialized for chain ${this.currentChainId}`);
      console.log('Available contracts:', Object.keys(this.contracts));
      console.log('Requested contract name:', contractName);
    }
    
    return contract;
  }

  public async executeTransaction(
    contractName: keyof Chain['contracts'],
    method: string,
    params: any[],
    options?: { value?: string }
  ): Promise<TransactionResult> {
    console.log(`executeTransaction called: ${contractName}.${method}`);
    console.log('Parameters:', params);
    console.log('Current chain ID:', this.currentChainId);
    console.log('Signer available:', !!this.signer);
    
    if (!this.signer) {
      throw new Error('No signer available for transaction. Please connect a wallet.');
    }

    const contract = this.getContract(contractName, this.currentChainId!);
    if (!contract) {
      throw new Error(`Contract ${contractName} not initialized for chain ${this.currentChainId}.`);
    }

    console.log('Contract address:', contract.target);
    console.log('Contract method exists:', typeof contract[method] === 'function');

    try {
      // Check if method exists
      if (typeof contract[method] !== 'function') {
        throw new Error(`Method ${method} does not exist on contract ${contractName}`);
      }

      console.log(`Executing transaction: ${contractName}.${method}(${params.join(', ')})`);
      console.log('Transaction options:', options);
      
      // Prepare transaction options
      const txOptions: any = {};
      if (options?.value) {
        txOptions.value = options.value;
        console.log('Transaction value:', options.value);
      }
      
      // Estimate gas first
      try {
        const gasEstimate = await contract[method].estimateGas(...params, txOptions);
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (gasError) {
        console.warn('Gas estimation failed:', gasError);
        // Continue anyway, let the transaction fail if needed
      }

      const transactionResponse: ethers.ContractTransactionResponse = await contract[method](...params, txOptions);
      console.log('Transaction sent successfully!');
      console.log('Transaction hash:', transactionResponse.hash);
      console.log('Transaction response:', transactionResponse);

      return {
        hash: transactionResponse.hash,
        status: 'pending',
      };
    } catch (error: any) {
      console.error(`Error executing transaction ${contractName}.${method}:`, error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        data: error.data,
        stack: error.stack
      });
      
      // Provide more specific error messages
      let errorMessage = 'Transaction failed: ';
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        errorMessage += 'User rejected the transaction';
      } else if (error.code === 'INSUFFICIENT_FUNDS' || error.code === -32000) {
        errorMessage += 'Insufficient funds for gas fees';
      } else if (error.reason) {
        errorMessage += error.reason;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error';
      }
      
      throw new Error(errorMessage);
    }
  }

  public listenToEvents(contractName: keyof Chain['contracts'], eventName: string, callback: Function): void {
    const contract = this.getContract(contractName, this.currentChainId!);
    if (!contract) {
      console.warn(`Cannot listen to events: Contract ${contractName} not initialized.`);
      return;
    }

    console.log(`Listening to event: ${contractName}.${eventName}`);
    contract.on(eventName, (...args: any[]) => {
      console.log(`Event ${eventName} received for ${contractName}:`, args);
      callback(...args);
    });
  }

  /**
   * Check if a specific contract is available and healthy
   */
  public async isContractAvailable(contractName: keyof Chain['contracts']): Promise<boolean> {
    if (!this.healthChecker) {
      console.warn('Health checker not initialized');
      return false;
    }

    return await this.healthChecker.checkContractAvailability(contractName);
  }

  /**
   * Get the health status of a specific contract
   */
  public async getContractHealth(contractName: keyof Chain['contracts']) {
    if (!this.healthChecker) {
      console.warn('Health checker not initialized');
      return null;
    }

    return await this.healthChecker.getContractStatus(contractName);
  }

  /**
   * Refresh the health report for all contracts
   */
  public async refreshHealthReport(): Promise<ContractHealthReport | null> {
    if (!this.healthChecker) {
      console.warn('Health checker not initialized');
      return null;
    }

    try {
      this.lastHealthReport = await this.healthChecker.getAllContractsStatus();
      return this.lastHealthReport;
    } catch (error) {
      console.error('Failed to refresh health report:', error);
      return null;
    }
  }

  /**
   * Check if critical contracts are available
   */
  public async checkCriticalContracts() {
    if (!this.healthChecker) {
      console.warn('Health checker not initialized');
      return { available: false, missing: ['health checker not initialized'] };
    }

    return await this.healthChecker.checkCriticalContracts();
  }
}

export default ContractManager;