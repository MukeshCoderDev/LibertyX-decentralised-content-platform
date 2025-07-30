import React, { useState, useEffect, useCallback } from 'react';
import { useContractManager } from '../hooks/useContractManager';
import { ethers } from 'ethers';

interface SubscriptionStats {
  subscriberCount: number;
  totalRevenue: string;
  activeSubscriptions: number;
  averageSubscriptionLength: number;
  recentSubscriptions: Array<{
    subscriber: string;
    timestamp: number;
    amount: string;
  }>;
}

interface SubscriptionAnalyticsProps {
  creatorAddress: string;
}

const SubscriptionAnalytics: React.FC<SubscriptionAnalyticsProps> = ({
  creatorAddress
}) => {
  const contractManager = useContractManager();
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!contractManager || !creatorAddress) return;

    setLoading(true);
    setError(null);

    try {
      const contract = contractManager.getContract('subscriptionManager', contractManager.currentChainId!);
      if (!contract) {
        throw new Error('Subscription contract not available');
      }

      // Get subscription events
      const filter = contract.filters.Subscribed(creatorAddress);
      const events = await contract.queryFilter(filter, -10000); // Last ~10k blocks

      const subscriptions = events.map(event => ({
        subscriber: event.args[1],
        timestamp: Date.now(), // In real implementation, get from block timestamp
        amount: ethers.formatEther(event.args[2] || '0')
      }));

      // Calculate stats
      const subscriberCount = new Set(subscriptions.map(s => s.subscriber)).size;
      const totalRevenue = subscriptions.reduce((sum, sub) => 
        sum + parseFloat(sub.amount), 0
      ).toFixed(4);

      // Get current plan to estimate active subscriptions
      const plan = await contract.plans(creatorAddress);
      const planDuration = Number(plan.duration);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Estimate active subscriptions (simplified)
      const recentSubscriptions = subscriptions.filter(sub => 
        (currentTime - sub.timestamp / 1000) < planDuration
      );

      setStats({
        subscriberCount,
        totalRevenue,
        activeSubscriptions: recentSubscriptions.length,
        averageSubscriptionLength: planDuration / (24 * 60 * 60), // Convert to days
        recentSubscriptions: subscriptions.slice(-5) // Last 5 subscriptions
      });

    } catch (err: any) {
      console.error('Error loading subscription analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [contractManager, creatorAddress]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-border rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-border rounded"></div>
            <div className="h-16 bg-border rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load analytics</p>
          <button
            onClick={loadAnalytics}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-card p-6 rounded-2xl text-center">
        <p className="text-text-secondary">No subscription data available</p>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-2xl">
      <h3 className="text-xl font-satoshi font-bold mb-6">Subscription Analytics</h3>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-background p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-primary">{stats.subscriberCount}</div>
          <div className="text-sm text-text-secondary">Total Subscribers</div>
        </div>
        
        <div className="bg-background p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">{stats.totalRevenue} ETH</div>
          <div className="text-sm text-text-secondary">Total Revenue</div>
        </div>
        
        <div className="bg-background p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.activeSubscriptions}</div>
          <div className="text-sm text-text-secondary">Active Subs</div>
        </div>
        
        <div className="bg-background p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.averageSubscriptionLength}d</div>
          <div className="text-sm text-text-secondary">Avg Duration</div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recentSubscriptions.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Recent Subscriptions</h4>
          <div className="space-y-2">
            {stats.recentSubscriptions.map((sub, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-background rounded-lg">
                <div>
                  <div className="text-sm font-medium">
                    {sub.subscriber.slice(0, 6)}...{sub.subscriber.slice(-4)}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {new Date(sub.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm font-medium text-primary">
                  {sub.amount} ETH
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionAnalytics;