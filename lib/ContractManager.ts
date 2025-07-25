import { ethers, Signer, Provider } from 'ethers';
import { Chain, TransactionResult, ContractManager as IContractManager } from './web3-types';
import { getContractInstance } from './contractUtils';
import { SUPPORTED_CHAINS, getChainByChainId } from './blockchainConfig';

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
    this.initializeContracts();
  }

  private initializeContracts() {
    if (!this.currentChainId || !this.provider) {
      console.warn('Cannot initialize contracts: chainId or provider is missing.');
      return;
    }

    const chain = getChainByChainId(this.currentChainId);
    if (!chain) {
      console.error(`Chain with ID ${this.currentChainId} not found.`);
      return;
    }

    for (const contractName in chain.contracts) {
      if (chain.contracts.hasOwnProperty(contractName)) {
        const contractInstance = getContractInstance(
          contractName as keyof Chain['contracts'],
          this.currentChainId,
          (this.signer || this.provider)! // Assert non-null as we checked above
        );
        if (contractInstance) {
          this.contracts[contractName as keyof IContractManager['contracts']] = contractInstance;
        }
      }
    }
    console.log('Contracts initialized:', this.contracts);
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
    return this.contracts[contractName];
  }

  public async executeTransaction(
    contractName: keyof Chain['contracts'],
    method: string,
    params: any[]
  ): Promise<TransactionResult> {
    if (!this.signer) {
      throw new Error('No signer available for transaction. Please connect a wallet.');
    }

    const contract = this.getContract(contractName, this.currentChainId!);
    if (!contract) {
      throw new Error(`Contract ${contractName} not initialized for chain ${this.currentChainId}.`);
    }

    try {
      console.log(`Executing transaction: ${contractName}.${method}(${params.join(', ')})`);
      const transactionResponse: ethers.ContractTransactionResponse = await contract[method](...params);
      console.log('Transaction sent, hash:', transactionResponse.hash);

      return {
        hash: transactionResponse.hash,
        status: 'pending',
      };
    } catch (error: any) {
      console.error(`Error executing transaction ${contractName}.${method}:`, error);
      throw new Error(`Transaction failed: ${error.message || error.reason || 'Unknown error'}`);
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
}

export default ContractManager;