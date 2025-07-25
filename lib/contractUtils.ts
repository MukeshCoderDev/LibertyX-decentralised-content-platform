import { ethers } from 'ethers';
import { Chain } from './web3-types';
import { SUPPORTED_CHAINS, getChainByChainId } from './blockchainConfig';

import LibertyTokenABI from '@artifacts/contracts/01_LibertyToken.sol/LibertyToken.json';
import CreatorRegistryABI from '@artifacts/contracts/02_CreatorRegistry.sol/CreatorRegistry.json';
import ContentRegistryABI from '@artifacts/contracts/03_ContentRegistry.sol/ContentRegistry.json';
import RevenueSplitterABI from '@artifacts/contracts/04_RevenueSplitter.sol/RevenueSplitter.json';
import SubscriptionManagerABI from '@artifacts/contracts/05_SubscriptionManager.sol/SubscriptionManager.json';
import NFTAccessABI from '@artifacts/contracts/06_NFTAccess.sol/NFTAccess.json';
import LibertyDAOABI from '@artifacts/contracts/07_LibertyDAO.sol/LibertyDAO.json';
// import TipJarABI from '@artifacts/contracts/TipJar.sol/TipJar.json'; // Removed as TipJar.sol does not exist

const ABIs: { [key: string]: any } = {
  libertyToken: LibertyTokenABI.abi,
  creatorRegistry: CreatorRegistryABI.abi,
  contentRegistry: ContentRegistryABI.abi,
  revenueSplitter: RevenueSplitterABI.abi,
  subscriptionManager: SubscriptionManagerABI.abi,
  nftAccess: NFTAccessABI.abi,
  libertyDAO: LibertyDAOABI.abi,
};

export const getContractInstance = (
  contractName: keyof Chain['contracts'],
  chainId: number,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract | null => {
  const chain = getChainByChainId(chainId);
  if (!chain) {
    console.error(`Chain with ID ${chainId} not found in supported configurations.`);
    return null;
  }

  const contractAddress = chain.contracts[contractName];
  if (!contractAddress || contractAddress === '0x...') {
    console.warn(`Contract address for ${contractName} not configured for chain ID ${chainId}.`);
    return null;
  }

  const contractABI = ABIs[contractName];
  if (!contractABI || contractABI.length === 0) {
    console.error(`ABI for contract ${contractName} not found.`);
    return null;
  }

  try {
    return new ethers.Contract(contractAddress, contractABI, signerOrProvider);
  } catch (error) {
    console.error(`Error initializing contract ${contractName} on chain ${chainId}:`, error);
    return null;
  }
};