import React, { useState } from 'react';
import { useCrossChainBridge, BridgeTransaction } from '../hooks/useCrossChainBridge';
import { useWallet } from '../lib/WalletProvider';
import Button from './ui/Button';

const BridgeHistory: React.FC = () => {
  const { account } = useWallet();
  const {
    bridgeHistory,
    activeBridges,
    supportedChains,
    trackBridgeStatus,
    cancelBridge,
    retryFailedBridge
  } = useCrossChainBridge();

  const [selectedTab, setSelectedTab] = useState<'active' | 'history'>('active');
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const getChainInfo = (chainId: number) => {
    return supportedChains.find(chain => chain.chainId === chainId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'confirmed':
        return 'text-blue-400 bg-blue-500/20';
      case 'completed':
        return 'text-green-400 bg-green-500/20';
      case 'failed':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-text-secondary bg-border/20';
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getTimeRemaining = (transaction: BridgeTransaction): string => {
    const elapsed = Date.now() - transaction.timestamp;
    const remaining = (transaction.estimatedTime * 1000) - elapsed;
    
    if (remaining <= 0) {
      return 'Processing...';
    }
    
    return `~${formatDuration(Math.floor(remaining / 1000))} remaining`;
  };

  const handleRefreshStatus = async (transactionId: string) => {
    try {
      setRefreshing(transactionId);
      await trackBridgeStatus(transactionId);
    } catch (err) {
      console.error('Error refreshing status:', err);
    } finally {
      setRefreshing(null);
    }
  };

  const handleCancelBridge = async (transactionId: string) => {
    if (!confirm('Are you sure you want to cancel this bridge transaction?')) {
      return;
    }

    try {
      await cancelBridge(transactionId);
      alert('Bridge transaction cancelled');
    } catch (err) {
      alert(`Failed to cancel: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRetryBridge = async (transactionId: string) => {
    try {
      const newTransactionId = await retryFailedBridge(transactionId);
      alert(`Bridge retried! New transaction ID: ${newTransactionId}`);
    } catch (err) {
      alert(`Failed to retry: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const openBlockExplorer = (chainId: number, txHash: string) => {
    const chainInfo = getChainInfo(chainId);
    if (chainInfo) {
      window.open(`${chainInfo.blockExplorer}/tx/${txHash}`, '_blank');
    }
  };

  const renderTransactionRow = (transaction: BridgeTransaction) => {
    const sourceChain = getChainInfo(transaction.sourceChain);
    const destChain = getChainInfo(transaction.destinationChain);
    const isActive = transaction.status === 'pending' || transaction.status === 'confirmed';

    return (
      <div key={transaction.id} className="bg-background/30 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center gap-1 text-sm">
                {sourceChain?.icon} {sourceChain?.name}
              </span>
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span className="flex items-center gap-1 text-sm">
                {destChain?.icon} {destChain?.name}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span>{transaction.amount} {transaction.token}</span>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(transaction.status)}`}>
                {transaction.status.toUpperCase()}
              </span>
              <span>{new Date(transaction.timestamp).toLocaleDateString()}</span>
            </div>

            {isActive && (
              <div className="mt-2 text-xs text-yellow-400">
                {getTimeRemaining(transaction)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Status Button */}
            {isActive && (
              <button
                onClick={() => handleRefreshStatus(transaction.id)}
                disabled={refreshing === transaction.id}
                className="p-2 bg-card border border-border rounded-lg hover:border-primary transition-colors disabled:opacity-50"
                title="Refresh status"
              >
                <svg 
                  className={`w-4 h-4 text-text-secondary ${refreshing === transaction.id ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}

            {/* View on Explorer */}
            <button
              onClick={() => openBlockExplorer(transaction.sourceChain, transaction.txHash)}
              className="p-2 bg-card border border-border rounded-lg hover:border-primary transition-colors"
              title="View on block explorer"
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>

            {/* Action Buttons */}
            {transaction.status === 'pending' && (
              <Button
                variant="secondary"
                onClick={() => handleCancelBridge(transaction.id)}
                className="text-xs px-3 py-1"
              >
                Cancel
              </Button>
            )}

            {transaction.status === 'failed' && (
              <Button
                variant="primary"
                onClick={() => handleRetryBridge(transaction.id)}
                className="text-xs px-3 py-1"
              >
                Retry
              </Button>
            )}

            {transaction.status === 'completed' && transaction.destinationTxHash && (
              <button
                onClick={() => openBlockExplorer(transaction.destinationChain, transaction.destinationTxHash!)}
                className="text-xs text-green-400 hover:text-green-300"
                title="View destination transaction"
              >
                View Receipt
              </button>
            )}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-text-secondary">Fee Paid:</span>
              <div className="font-medium">{transaction.fees.amount} {transaction.fees.token}</div>
            </div>
            <div>
              <span className="text-text-secondary">TX Hash:</span>
              <div className="font-mono truncate">{transaction.txHash.slice(0, 10)}...</div>
            </div>
            <div>
              <span className="text-text-secondary">Est. Time:</span>
              <div className="font-medium">{formatDuration(transaction.estimatedTime)}</div>
            </div>
            <div>
              <span className="text-text-secondary">ID:</span>
              <div className="font-mono truncate">{transaction.id.slice(-8)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!account) {
    return (
      <div className="bg-card p-6 rounded-2xl text-center">
        <p className="text-text-secondary">Connect your wallet to view bridge history</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-satoshi font-bold">Bridge History</h2>
        
        {/* Tab Navigation */}
        <div className="flex bg-card rounded-lg p-1">
          <button
            onClick={() => setSelectedTab('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'active'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Active ({activeBridges.length})
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'history'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            All History ({bridgeHistory.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card p-6 rounded-2xl">
        {selectedTab === 'active' ? (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Active Bridges</h3>
            {activeBridges.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🌉</div>
                <p className="text-text-secondary">No active bridge transactions</p>
                <p className="text-sm text-text-secondary mt-1">
                  Your pending and confirmed bridges will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBridges.map(renderTransactionRow)}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Transaction History</h3>
            {bridgeHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📜</div>
                <p className="text-text-secondary">No bridge history yet</p>
                <p className="text-sm text-text-secondary mt-1">
                  Your completed bridge transactions will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bridgeHistory.map(renderTransactionRow)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bridge Statistics */}
      {bridgeHistory.length > 0 && (
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="font-medium text-lg mb-4">Bridge Statistics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {bridgeHistory.length}
              </div>
              <div className="text-sm text-text-secondary">Total Bridges</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {bridgeHistory.filter(tx => tx.status === 'completed').length}
              </div>
              <div className="text-sm text-text-secondary">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {activeBridges.length}
              </div>
              <div className="text-sm text-text-secondary">In Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BridgeHistory;