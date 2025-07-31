import React, { useState, useEffect } from 'react';
import { useCrossChainBridge } from '../hooks/useCrossChainBridge';
import { useWallet } from '../lib/WalletProvider';
import CrossChainBridge from './CrossChainBridge';
import BridgeHistory from './BridgeHistory';
import BridgeRecovery from './BridgeRecovery';


interface BridgeStats {
  totalVolume: number;
  totalTransactions: number;
  averageFee: number;
  popularRoutes: {
    from: string;
    to: string;
    count: number;
  }[];
}

const BridgeDashboard: React.FC = () => {
  const { account } = useWallet();
  const { supportedChains, bridgeHistory, activeBridges } = useCrossChainBridge();
  const [activeTab, setActiveTab] = useState<'bridge' | 'history' | 'analytics' | 'recovery'>('bridge');
  const [bridgeStats, setBridgeStats] = useState<BridgeStats | null>(null);

  useEffect(() => {
    if (bridgeHistory.length > 0) {
      calculateBridgeStats();
    }
  }, [bridgeHistory]);

  const calculateBridgeStats = () => {
    const totalVolume = bridgeHistory.reduce((sum, tx) => {
      return sum + parseFloat(tx.amount);
    }, 0);

    const totalFees = bridgeHistory.reduce((sum, tx) => {
      return sum + parseFloat(tx.fees.amount);
    }, 0);

    const averageFee = bridgeHistory.length > 0 ? totalFees / bridgeHistory.length : 0;

    // Calculate popular routes
    const routeCount: { [key: string]: number } = {};
    bridgeHistory.forEach(tx => {
      const sourceChain = supportedChains.find(c => c.chainId === tx.sourceChain);
      const destChain = supportedChains.find(c => c.chainId === tx.destinationChain);
      if (sourceChain && destChain) {
        const route = `${sourceChain.name}-${destChain.name}`;
        routeCount[route] = (routeCount[route] || 0) + 1;
      }
    });

    const popularRoutes = Object.entries(routeCount)
      .map(([route, count]) => {
        const [from, to] = route.split('-');
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setBridgeStats({
      totalVolume,
      totalTransactions: bridgeHistory.length,
      averageFee,
      popularRoutes
    });
  };

  const getChainIcon = (chainName: string) => {
    const chain = supportedChains.find(c => c.name === chainName);
    return chain?.icon || '🔗';
  };

  return (
    <div className="container mx-auto px-4 py-8 mb-16 md:mb-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-satoshi font-bold">Cross-Chain Bridge</h1>
        
        {/* Quick Stats */}
        {account && bridgeHistory.length > 0 && (
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-primary">{activeBridges.length}</div>
              <div className="text-text-secondary">Active</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-400">
                {bridgeHistory.filter(tx => tx.status === 'completed').length}
              </div>
              <div className="text-text-secondary">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-400">
                {bridgeHistory.filter(tx => tx.status === 'failed').length}
              </div>
              <div className="text-text-secondary">Failed</div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-card rounded-lg p-1 mb-8">
        <button
          onClick={() => setActiveTab('bridge')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-2 ${
            activeTab === 'bridge'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          <span>🌉</span>
          <span>Bridge Tokens</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-2 ${
            activeTab === 'history'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          <span>📜</span>
          <span>History</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          <span>📊</span>
          <span>Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('recovery')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-2 ${
            activeTab === 'recovery'
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-white'
          }`}
        >
          <span>🔧</span>
          <span>Recovery</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'bridge' && (
        <div className="space-y-8">
          <CrossChainBridge />
          
          {/* Supported Networks */}
          <div className="bg-card p-6 rounded-2xl">
            <h3 className="text-lg font-satoshi font-bold mb-4">Supported Networks</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {supportedChains.map(chain => (
                <div key={chain.chainId} className="text-center p-3 bg-background/30 rounded-lg">
                  <div className="text-2xl mb-2">{chain.icon}</div>
                  <div className="font-medium text-sm">{chain.name}</div>
                  <div className="text-xs text-text-secondary">{chain.symbol}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bridge Features */}
          <div className="bg-card p-6 rounded-2xl">
            <h3 className="text-lg font-satoshi font-bold mb-4">Bridge Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-green-400">⚡</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Fast Transfers</h4>
                    <p className="text-sm text-text-secondary">
                      Most bridges complete in 5-15 minutes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400">🔒</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Secure Protocol</h4>
                    <p className="text-sm text-text-secondary">
                      Audited smart contracts and proven security
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-400">💰</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Low Fees</h4>
                    <p className="text-sm text-text-secondary">
                      Competitive rates with transparent pricing
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-400">🔄</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Auto Recovery</h4>
                    <p className="text-sm text-text-secondary">
                      Failed transactions can be retried automatically
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && <BridgeHistory />}

      {activeTab === 'recovery' && <BridgeRecovery />}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {!account ? (
            <div className="bg-card p-6 rounded-2xl text-center">
              <p className="text-text-secondary">Connect your wallet to view bridge analytics</p>
            </div>
          ) : bridgeHistory.length === 0 ? (
            <div className="bg-card p-6 rounded-2xl text-center">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-text-secondary">No bridge data yet</p>
              <p className="text-sm text-text-secondary mt-1">
                Complete some bridge transactions to see analytics
              </p>
            </div>
          ) : (
            <>
              {/* Bridge Statistics */}
              {bridgeStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-card p-6 rounded-2xl">
                    <h3 className="text-sm font-medium text-text-secondary mb-2">Total Volume</h3>
                    <p className="text-2xl font-bold text-primary">
                      {bridgeStats.totalVolume.toFixed(2)} LIB
                    </p>
                  </div>
                  
                  <div className="bg-card p-6 rounded-2xl">
                    <h3 className="text-sm font-medium text-text-secondary mb-2">Total Bridges</h3>
                    <p className="text-2xl font-bold text-primary">
                      {bridgeStats.totalTransactions}
                    </p>
                  </div>
                  
                  <div className="bg-card p-6 rounded-2xl">
                    <h3 className="text-sm font-medium text-text-secondary mb-2">Average Fee</h3>
                    <p className="text-2xl font-bold text-primary">
                      {bridgeStats.averageFee.toFixed(4)} LIB
                    </p>
                  </div>
                  
                  <div className="bg-card p-6 rounded-2xl">
                    <h3 className="text-sm font-medium text-text-secondary mb-2">Success Rate</h3>
                    <p className="text-2xl font-bold text-green-400">
                      {((bridgeHistory.filter(tx => tx.status === 'completed').length / bridgeHistory.length) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Popular Routes */}
              {bridgeStats && bridgeStats.popularRoutes.length > 0 && (
                <div className="bg-card p-6 rounded-2xl">
                  <h3 className="text-lg font-satoshi font-bold mb-4">Popular Bridge Routes</h3>
                  <div className="space-y-3">
                    {bridgeStats.popularRoutes.map((route, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getChainIcon(route.from)}</span>
                          <span className="text-sm font-medium">{route.from}</span>
                          <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <span className="text-lg">{getChainIcon(route.to)}</span>
                          <span className="text-sm font-medium">{route.to}</span>
                        </div>
                        <div className="text-sm text-text-secondary">
                          {route.count} bridge{route.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bridge Status Distribution */}
              <div className="bg-card p-6 rounded-2xl">
                <h3 className="text-lg font-satoshi font-bold mb-4">Transaction Status Distribution</h3>
                <div className="space-y-3">
                  {[
                    { status: 'completed', label: 'Completed', color: 'bg-green-500' },
                    { status: 'pending', label: 'Pending', color: 'bg-yellow-500' },
                    { status: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
                    { status: 'failed', label: 'Failed', color: 'bg-red-500' }
                  ].map(({ status, label, color }) => {
                    const count = bridgeHistory.filter(tx => tx.status === status).length;
                    const percentage = bridgeHistory.length > 0 ? (count / bridgeHistory.length) * 100 : 0;
                    
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${color}`}></div>
                        <span className="text-sm font-medium flex-1">{label}</span>
                        <span className="text-sm text-text-secondary">{count}</span>
                        <div className="w-24 bg-border rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-text-secondary w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BridgeDashboard;