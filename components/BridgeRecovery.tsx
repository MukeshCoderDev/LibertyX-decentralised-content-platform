import React, { useState, useEffect } from 'react';
import { useCrossChainBridge, BridgeTransaction } from '../hooks/useCrossChainBridge';
import { useWallet } from '../lib/WalletProvider';
import Button from './ui/Button';

interface RecoveryOption {
  id: string;
  title: string;
  description: string;
  action: () => Promise<void>;
  severity: 'low' | 'medium' | 'high';
}

const BridgeRecovery: React.FC = () => {
  const { account } = useWallet();
  const {
    bridgeHistory,
    supportedChains,
    retryFailedBridge,
    trackBridgeStatus,
    isLoading
  } = useCrossChainBridge();

  const [failedTransactions, setFailedTransactions] = useState<BridgeTransaction[]>([]);
  const [stuckTransactions, setStuckTransactions] = useState<BridgeTransaction[]>([]);
  const [recoveryOptions, setRecoveryOptions] = useState<RecoveryOption[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<BridgeTransaction | null>(null);
  const [recovering, setRecovering] = useState<string | null>(null);

  useEffect(() => {
    if (bridgeHistory.length > 0) {
      analyzeTransactions();
    }
  }, [bridgeHistory]);

  const analyzeTransactions = () => {
    const now = Date.now();
    const failed = bridgeHistory.filter(tx => tx.status === 'failed');
    const stuck = bridgeHistory.filter(tx => {
      const elapsed = now - tx.timestamp;
      const expectedCompletion = tx.estimatedTime * 1000 * 2; // 2x expected time
      return (tx.status === 'pending' || tx.status === 'confirmed') && elapsed > expectedCompletion;
    });

    setFailedTransactions(failed);
    setStuckTransactions(stuck);
    generateRecoveryOptions(failed, stuck);
  };

  const generateRecoveryOptions = (failed: BridgeTransaction[], stuck: BridgeTransaction[]) => {
    const options: RecoveryOption[] = [];

    // Failed transaction recovery
    failed.forEach(tx => {
      options.push({
        id: `retry-${tx.id}`,
        title: `Retry Failed Bridge`,
        description: `Retry bridge from ${getChainName(tx.sourceChain)} to ${getChainName(tx.destinationChain)}`,
        action: async () => {
          await handleRetryTransaction(tx.id);
        },
        severity: 'high'
      });
    });

    // Stuck transaction recovery
    stuck.forEach(tx => {
      options.push({
        id: `check-${tx.id}`,
        title: `Check Stuck Transaction`,
        description: `Verify status of bridge that's been pending for ${getElapsedTime(tx.timestamp)}`,
        action: async () => {
          await handleCheckStuckTransaction(tx.id);
        },
        severity: 'medium'
      });
    });

    // General recovery options
    if (failed.length > 0 || stuck.length > 0) {
      options.push({
        id: 'refresh-all',
        title: 'Refresh All Transactions',
        description: 'Check the latest status of all pending and failed transactions',
        action: async () => {
          await handleRefreshAllTransactions();
        },
        severity: 'low'
      });
    }

    setRecoveryOptions(options);
  };

  const getChainName = (chainId: number): string => {
    const chain = supportedChains.find(c => c.chainId === chainId);
    return chain ? chain.name : `Chain ${chainId}`;
  };

  const getElapsedTime = (timestamp: number): string => {
    const elapsed = Date.now() - timestamp;
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-500/50 bg-red-500/10';
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'low':
        return 'border-blue-500/50 bg-blue-500/10';
      default:
        return 'border-border bg-background/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return 'ℹ️';
      default:
        return '🔧';
    }
  };

  const handleRetryTransaction = async (transactionId: string) => {
    try {
      setRecovering(transactionId);
      const newTransactionId = await retryFailedBridge(transactionId);
      alert(`Bridge retried successfully! New transaction ID: ${newTransactionId}`);
      analyzeTransactions(); // Refresh analysis
    } catch (err) {
      alert(`Failed to retry bridge: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRecovering(null);
    }
  };

  const handleCheckStuckTransaction = async (transactionId: string) => {
    try {
      setRecovering(transactionId);
      const updatedTransaction = await trackBridgeStatus(transactionId);
      
      if (updatedTransaction.status === 'completed') {
        alert('Good news! Your transaction has completed successfully.');
      } else if (updatedTransaction.status === 'failed') {
        alert('Transaction has failed. You can retry it from the recovery options.');
      } else {
        alert(`Transaction is still ${updatedTransaction.status}. Please wait a bit longer.`);
      }
      
      analyzeTransactions(); // Refresh analysis
    } catch (err) {
      alert(`Failed to check transaction: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRecovering(null);
    }
  };

  const handleRefreshAllTransactions = async () => {
    try {
      setRecovering('refresh-all');
      
      const pendingTransactions = bridgeHistory.filter(tx => 
        tx.status === 'pending' || tx.status === 'confirmed'
      );

      await Promise.all(
        pendingTransactions.map(tx => trackBridgeStatus(tx.id))
      );

      alert('All transactions refreshed successfully!');
      analyzeTransactions(); // Refresh analysis
    } catch (err) {
      alert(`Failed to refresh transactions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRecovering(null);
    }
  };

  const openSupportTicket = () => {
    const subject = encodeURIComponent('Bridge Transaction Recovery Support');
    const body = encodeURIComponent(`
Hello LibertyX Support,

I need help with bridge transaction recovery.

Account: ${account}
Failed Transactions: ${failedTransactions.length}
Stuck Transactions: ${stuckTransactions.length}

Transaction Details:
${selectedTransaction ? `
- Transaction ID: ${selectedTransaction.id}
- Source Chain: ${getChainName(selectedTransaction.sourceChain)}
- Destination Chain: ${getChainName(selectedTransaction.destinationChain)}
- Amount: ${selectedTransaction.amount} ${selectedTransaction.token}
- Status: ${selectedTransaction.status}
- TX Hash: ${selectedTransaction.txHash}
` : 'Please see my bridge history for details.'}

Please assist with recovery options.

Thank you!
    `);
    
    window.open(`mailto:support@libertyx.com?subject=${subject}&body=${body}`, '_blank');
  };

  if (!account) {
    return (
      <div className="bg-card p-6 rounded-2xl text-center">
        <p className="text-text-secondary">Connect your wallet to access bridge recovery tools</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-satoshi font-bold">Bridge Recovery</h2>
        <Button
          variant="secondary"
          onClick={openSupportTicket}
          className="text-sm"
        >
          Contact Support
        </Button>
      </div>

      {/* Recovery Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Failed Transactions</h3>
          <p className="text-2xl font-bold text-red-400">{failedTransactions.length}</p>
          <p className="text-xs text-text-secondary mt-1">Need immediate attention</p>
        </div>
        
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Stuck Transactions</h3>
          <p className="text-2xl font-bold text-yellow-400">{stuckTransactions.length}</p>
          <p className="text-xs text-text-secondary mt-1">Taking longer than expected</p>
        </div>
        
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Recovery Options</h3>
          <p className="text-2xl font-bold text-primary">{recoveryOptions.length}</p>
          <p className="text-xs text-text-secondary mt-1">Available actions</p>
        </div>
      </div>

      {/* Recovery Options */}
      {recoveryOptions.length > 0 ? (
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-lg font-satoshi font-bold mb-4">Recovery Actions</h3>
          <div className="space-y-4">
            {recoveryOptions.map(option => (
              <div
                key={option.id}
                className={`border rounded-lg p-4 ${getSeverityColor(option.severity)}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getSeverityIcon(option.severity)}</span>
                    <div>
                      <h4 className="font-medium">{option.title}</h4>
                      <p className="text-sm text-text-secondary mt-1">{option.description}</p>
                    </div>
                  </div>
                  <Button
                    variant={option.severity === 'high' ? 'primary' : 'secondary'}
                    onClick={option.action}
                    disabled={recovering === option.id || isLoading}
                    className="text-sm whitespace-nowrap"
                  >
                    {recovering === option.id ? 'Processing...' : 'Execute'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card p-6 rounded-2xl text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-medium mb-2">All Good!</h3>
          <p className="text-text-secondary">
            No recovery actions needed. All your bridge transactions are working properly.
          </p>
        </div>
      )}

      {/* Failed Transactions Details */}
      {failedTransactions.length > 0 && (
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-lg font-satoshi font-bold mb-4">Failed Transactions</h3>
          <div className="space-y-4">
            {failedTransactions.map(tx => (
              <div key={tx.id} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {getChainName(tx.sourceChain)} → {getChainName(tx.destinationChain)}
                      </span>
                      <span className="text-sm text-text-secondary">
                        {tx.amount} {tx.token}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary">
                      Failed {getElapsedTime(tx.timestamp)} ago • TX: {tx.txHash.slice(0, 10)}...
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => handleRetryTransaction(tx.id)}
                      disabled={recovering === tx.id}
                      className="text-sm"
                    >
                      {recovering === tx.id ? 'Retrying...' : 'Retry'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedTransaction(tx)}
                      className="text-sm"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stuck Transactions Details */}
      {stuckTransactions.length > 0 && (
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-lg font-satoshi font-bold mb-4">Stuck Transactions</h3>
          <div className="space-y-4">
            {stuckTransactions.map(tx => (
              <div key={tx.id} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {getChainName(tx.sourceChain)} → {getChainName(tx.destinationChain)}
                      </span>
                      <span className="text-sm text-text-secondary">
                        {tx.amount} {tx.token}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary">
                      Pending for {getElapsedTime(tx.timestamp)} • Expected: {Math.floor(tx.estimatedTime / 60)}m
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleCheckStuckTransaction(tx.id)}
                      disabled={recovering === tx.id}
                      className="text-sm"
                    >
                      {recovering === tx.id ? 'Checking...' : 'Check Status'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedTransaction(tx)}
                      className="text-sm"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recovery Tips */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-lg font-satoshi font-bold mb-4">Recovery Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400">💡</span>
              </div>
              <div>
                <h4 className="font-medium">Wait Before Retrying</h4>
                <p className="text-sm text-text-secondary">
                  Network congestion can cause delays. Wait at least 2x the estimated time before considering a transaction stuck.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-400">🔄</span>
              </div>
              <div>
                <h4 className="font-medium">Check Network Status</h4>
                <p className="text-sm text-text-secondary">
                  Verify that both source and destination networks are operating normally before retrying.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-yellow-400">⛽</span>
              </div>
              <div>
                <h4 className="font-medium">Ensure Sufficient Gas</h4>
                <p className="text-sm text-text-secondary">
                  Make sure you have enough native tokens for gas fees on both chains before retrying.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-400">📞</span>
              </div>
              <div>
                <h4 className="font-medium">Contact Support</h4>
                <p className="text-sm text-text-secondary">
                  If recovery options don't work, our support team can help investigate and resolve issues.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BridgeRecovery;