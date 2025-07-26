import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '../lib/WalletProvider';

interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
  latency: number | null;
  blockNumber: number | null;
  lastUpdate: number;
  rpcEndpoint: string | null;
  chainId: number | null;
  error: string | null;
}

interface NetworkMonitorHook {
  networkStatus: NetworkStatus;
  isHealthy: boolean;
  reconnect: () => Promise<void>;
  checkConnectivity: () => Promise<boolean>;
  getNetworkHealth: () => 'healthy' | 'degraded' | 'offline';
}

export const useNetworkMonitor = (): NetworkMonitorHook => {
  const { provider, chainId } = useWallet();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnected: false,
    latency: null,
    blockNumber: null,
    lastUpdate: Date.now(),
    rpcEndpoint: null,
    chainId: null,
    error: null
  });

  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    if (!provider) {
      setNetworkStatus(prev => ({
        ...prev,
        isConnected: false,
        error: 'Provider not available',
        lastUpdate: Date.now()
      }));
      return false;
    }

    try {
      const startTime = Date.now();
      
      // Test basic connectivity by getting block number
      const blockNumber = await provider.getBlockNumber();
      const latency = Date.now() - startTime;

      // Get network info
      const network = await provider.getNetwork();

      setNetworkStatus(prev => ({
        ...prev,
        isConnected: true,
        latency,
        blockNumber,
        chainId: network.chainId,
        rpcEndpoint: null,
        error: null,
        lastUpdate: Date.now()
      }));

      reconnectAttempts.current = 0;
      return true;

    } catch (error) {
      console.error('Network connectivity check failed:', error);
      
      setNetworkStatus(prev => ({
        ...prev,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Network error',
        lastUpdate: Date.now()
      }));

      return false;
    }
  }, [provider]);

  const reconnect = useCallback(async (): Promise<void> => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      return;
    }

    reconnectAttempts.current++;
    
    try {
      // Wait before attempting reconnection
      await new Promise(resolve => setTimeout(resolve, 2000 * reconnectAttempts.current));
      
      const isConnected = await checkConnectivity();
      
      if (isConnected) {
        console.log('Successfully reconnected to network');
        window.dispatchEvent(new CustomEvent('networkReconnected', {
          detail: { attempts: reconnectAttempts.current }
        }));
      } else {
        // Try again if not at max attempts
        if (reconnectAttempts.current < maxReconnectAttempts) {
          setTimeout(reconnect, 5000);
        }
      }
    } catch (error) {
      console.error('Reconnection attempt failed:', error);
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        setTimeout(reconnect, 5000);
      }
    }
  }, [checkConnectivity]);

  const getNetworkHealth = useCallback((): 'healthy' | 'degraded' | 'offline' => {
    if (!networkStatus.isOnline || !networkStatus.isConnected) {
      return 'offline';
    }

    if (networkStatus.latency === null) {
      return 'offline';
    }

    // Add hysteresis to prevent rapid state changes
    if (networkStatus.latency > 8000) { // 8 seconds for degraded
      return 'degraded';
    }

    if (networkStatus.latency > 3000) { // 3 seconds threshold
      return 'degraded';
    }

    const timeSinceLastUpdate = Date.now() - networkStatus.lastUpdate;
    if (timeSinceLastUpdate > 90000) { // 1.5 minutes
      return 'degraded';
    }

    return 'healthy';
  }, [networkStatus]);

  const isHealthy = getNetworkHealth() === 'healthy';

  // Monitor network connectivity
  useEffect(() => {
    if (!provider) return;

    // Initial connectivity check
    checkConnectivity();

    // Set up periodic monitoring with much less frequent checks
    monitoringInterval.current = setInterval(async () => {
      // Only check if we're currently disconnected or having issues
      if (!networkStatus.isConnected || networkStatus.error) {
        const isConnected = await checkConnectivity();
        
        if (!isConnected && reconnectAttempts.current < maxReconnectAttempts) {
          reconnect();
        }
      }
    }, 60000); // Check every 60 seconds, and only if there are issues

    return () => {
      if (monitoringInterval.current) {
        clearInterval(monitoringInterval.current);
      }
    };
  }, [provider, checkConnectivity, reconnect, networkStatus.isConnected, networkStatus.error]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: true }));
      checkConnectivity();
      window.dispatchEvent(new CustomEvent('networkOnline'));
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ 
        ...prev, 
        isOnline: false, 
        isConnected: false,
        error: 'Device is offline'
      }));
      window.dispatchEvent(new CustomEvent('networkOffline'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnectivity]);

  // Listen for provider changes
  useEffect(() => {
    if (provider) {
      // Reset connection status when provider changes
      setNetworkStatus(prev => ({
        ...prev,
        isConnected: false,
        chainId: chainId,
        error: null
      }));
      
      reconnectAttempts.current = 0;
      checkConnectivity();
    }
  }, [provider, chainId, checkConnectivity]);

  // Listen for provider errors
  useEffect(() => {
    if (!provider) return;

    const handleProviderError = (error: any) => {
      console.error('Provider error:', error);
      setNetworkStatus(prev => ({
        ...prev,
        isConnected: false,
        error: error.message || 'Provider error'
      }));

      // Attempt to reconnect
      setTimeout(reconnect, 1000);
    };

    // Listen for provider errors
    provider.on('error', handleProviderError);

    return () => {
      provider.off('error', handleProviderError);
    };
  }, [provider, reconnect]);

  return {
    networkStatus,
    isHealthy,
    reconnect,
    checkConnectivity,
    getNetworkHealth
  };
};