import { useEffect, useCallback, useRef } from 'react';
import { Contract, EventFilter } from 'ethers';
import { useContractManager } from './useContractManager';
import { useWallet } from '../lib/WalletProvider';

interface EventSubscription {
  contract: Contract;
  eventName: string;
  filter?: EventFilter;
  callback: (event: any) => void;
}

interface BlockchainEventsHook {
  subscribeToEvent: (
    contractName: string,
    eventName: string,
    callback: (event: any) => void,
    filter?: any
  ) => void;
  unsubscribeFromEvent: (contractName: string, eventName: string) => void;
  subscribeToUserEvents: (userAddress: string) => void;
  unsubscribeFromUserEvents: () => void;
  isListening: boolean;
}

export const useBlockchainEvents = (): BlockchainEventsHook => {
  const contractManager = useContractManager();
  const { account, chainId } = useWallet();
  const contracts = contractManager?.contracts;
  const subscriptionsRef = useRef<Map<string, EventSubscription>>(new Map());
  const isListeningRef = useRef(false);

  const subscribeToEvent = useCallback((
    contractName: string,
    eventName: string,
    callback: (event: any) => void,
    filter?: any
  ) => {
    if (!contracts) {
      console.warn('Contracts not available');
      return;
    }
    
    const contract = contracts[contractName as keyof typeof contracts];
    if (!contract) {
      console.warn(`Contract ${contractName} not found`);
      return;
    }

    const subscriptionKey = `${contractName}-${eventName}`;
    
    // Remove existing subscription if any
    const existingSubscription = subscriptionsRef.current.get(subscriptionKey);
    if (existingSubscription) {
      existingSubscription.contract.off(eventName, existingSubscription.callback);
    }

    // Create new subscription
    const eventCallback = (event: any) => {
      console.log(`Event received: ${contractName}.${eventName}`, event);
      callback(event);
    };

    contract.on(eventName, eventCallback);
    
    subscriptionsRef.current.set(subscriptionKey, {
      contract,
      eventName,
      callback: eventCallback,
      filter
    });

    isListeningRef.current = true;
  }, [contracts]);

  const unsubscribeFromEvent = useCallback((contractName: string, eventName: string) => {
    const subscriptionKey = `${contractName}-${eventName}`;
    const subscription = subscriptionsRef.current.get(subscriptionKey);
    
    if (subscription) {
      subscription.contract.off(eventName, subscription.callback);
      subscriptionsRef.current.delete(subscriptionKey);
    }
  }, []);

  const subscribeToUserEvents = useCallback((userAddress: string) => {
    if (!userAddress || !contracts) return;

    // Subscribe to creator-related events
    subscribeToEvent('creatorRegistry', 'CreatorRegistered', (event) => {
      if (event.creator.toLowerCase() === userAddress.toLowerCase()) {
        // Trigger UI update for creator registration
        window.dispatchEvent(new CustomEvent('creatorRegistered', { detail: event }));
      }
    });

    subscribeToEvent('creatorRegistry', 'ProfileUpdated', (event) => {
      if (event.creator.toLowerCase() === userAddress.toLowerCase()) {
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: event }));
      }
    });

    // Subscribe to content-related events
    subscribeToEvent('contentRegistry', 'ContentUploaded', (event) => {
      if (event.creator.toLowerCase() === userAddress.toLowerCase()) {
        window.dispatchEvent(new CustomEvent('contentUploaded', { detail: event }));
      }
    });

    // Subscribe to subscription events
    subscribeToEvent('subscriptionManager', 'SubscriptionCreated', (event) => {
      if (event.creator.toLowerCase() === userAddress.toLowerCase()) {
        window.dispatchEvent(new CustomEvent('subscriptionCreated', { detail: event }));
      }
    });

    subscribeToEvent('subscriptionManager', 'UserSubscribed', (event) => {
      if (event.subscriber.toLowerCase() === userAddress.toLowerCase() || 
          event.creator.toLowerCase() === userAddress.toLowerCase()) {
        window.dispatchEvent(new CustomEvent('userSubscribed', { detail: event }));
      }
    });

    // Subscribe to NFT events
    subscribeToEvent('nftAccess', 'TierCreated', (event) => {
      if (event.creator.toLowerCase() === userAddress.toLowerCase()) {
        window.dispatchEvent(new CustomEvent('nftTierCreated', { detail: event }));
      }
    });

    subscribeToEvent('nftAccess', 'NFTMinted', (event) => {
      if (event.to.toLowerCase() === userAddress.toLowerCase()) {
        window.dispatchEvent(new CustomEvent('nftMinted', { detail: event }));
      }
    });

    // Subscribe to revenue events
    subscribeToEvent('revenueSplitter', 'RevenueDistributed', (event) => {
      if (event.creator.toLowerCase() === userAddress.toLowerCase()) {
        window.dispatchEvent(new CustomEvent('revenueDistributed', { detail: event }));
      }
    });

    // Subscribe to governance events
    subscribeToEvent('libertyDAO', 'ProposalCreated', (event) => {
      window.dispatchEvent(new CustomEvent('proposalCreated', { detail: event }));
    });

    subscribeToEvent('libertyDAO', 'VoteCast', (event) => {
      if (event.voter.toLowerCase() === userAddress.toLowerCase()) {
        window.dispatchEvent(new CustomEvent('voteCast', { detail: event }));
      }
    });

    // Subscribe to token transfer events for balance updates
    subscribeToEvent('libertyToken', 'Transfer', (event) => {
      if (event.from.toLowerCase() === userAddress.toLowerCase() || 
          event.to.toLowerCase() === userAddress.toLowerCase()) {
        window.dispatchEvent(new CustomEvent('tokenTransfer', { detail: event }));
      }
    });

  }, [subscribeToEvent, contracts]);

  const unsubscribeFromUserEvents = useCallback(() => {
    // Unsubscribe from all user-specific events
    const eventTypes = [
      'creatorRegistry-CreatorRegistered',
      'creatorRegistry-ProfileUpdated',
      'contentRegistry-ContentUploaded',
      'subscriptionManager-SubscriptionCreated',
      'subscriptionManager-UserSubscribed',
      'nftAccess-TierCreated',
      'nftAccess-NFTMinted',
      'revenueSplitter-RevenueDistributed',
      'libertyDAO-ProposalCreated',
      'libertyDAO-VoteCast',
      'libertyToken-Transfer'
    ];

    eventTypes.forEach(eventType => {
      const [contractName, eventName] = eventType.split('-');
      unsubscribeFromEvent(contractName, eventName);
    });

    isListeningRef.current = false;
  }, [unsubscribeFromEvent]);

  // Auto-subscribe to user events when account changes (with debouncing)
  useEffect(() => {
    let subscriptionTimeout: NodeJS.Timeout;
    
    if (account && chainId) {
      // Debounce subscription to prevent rapid re-subscriptions
      subscriptionTimeout = setTimeout(() => {
        subscribeToUserEvents(account);
      }, 1000);
    } else {
      unsubscribeFromUserEvents();
    }

    return () => {
      clearTimeout(subscriptionTimeout);
      unsubscribeFromUserEvents();
    };
  }, [account, chainId, subscribeToUserEvents, unsubscribeFromUserEvents]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach((subscription) => {
        subscription.contract.off(subscription.eventName, subscription.callback);
      });
      subscriptionsRef.current.clear();
    };
  }, []);

  return {
    subscribeToEvent,
    unsubscribeFromEvent,
    subscribeToUserEvents,
    unsubscribeFromUserEvents,
    isListening: isListeningRef.current
  };
};