import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useWallet } from '../lib/WalletProvider';
import { useRevenueSplitter } from '../hooks/useRevenueSplitter';
import { TokenBalance } from '../types';
import { getAllTokens, getTokensByCategory, TOKEN_CATEGORIES, formatTokenAmount, getTokenConfig } from '../lib/tokenConfig';
import TokenSelector from './TokenSelector';
import Button from './ui/Button';

interface EarningsData {
  totalEarnings: TokenBalance[];
  availableBalance: TokenBalance[];
  pendingBalance: TokenBalance[];
  dailyEarnings: ChartDataPoint[];
  monthlyEarnings: ChartDataPoint[];
  revenueBySource: RevenueSource[];
  recentTransactions: EarningsTransaction[];
}

interface ChartDataPoint {
  date: string;
  earnings: number;
  token: string;
}

interface RevenueSource {
  source: string;
  amount: number;
  percentage: number;
  color: string;
}

interface EarningsTransaction {
  id: string;
  type: 'content_purchase' | 'subscription' | 'nft_mint' | 'withdrawal';
  amount: TokenBalance;
  from: string;
  timestamp: number;
  txHash: string;
}

const EarningsDashboard: React.FC = () => {
  const { account, chainId } = useWallet();
  const { getCreatorEarnings, listenToSplitEvents, loading: revenueLoading } = useRevenueSplitter();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedToken, setSelectedToken] = useState<string>('ETH');

  useEffect(() => {
    if (account) {
      loadEarningsData();
    }
  }, [account, chainId, selectedTimeframe]);

  const loadEarningsData = async () => {
    if (!account) return;

    try {
      setLoading(true);
      
      // Get earnings data using the revenue splitter hook
      const earningsResult = await getCreatorEarnings(account);
      
      // Convert revenue splits to earnings transactions
      const earnings: EarningsTransaction[] = earningsResult.recentSplits.map(split => ({
        id: split.txHash,
        type: 'content_purchase',
        amount: {
          amount: split.creatorShare,
          token: 'ETH',
          decimals: 18,
          symbol: 'ETH'
        },
        from: split.payer,
        timestamp: split.timestamp,
        txHash: split.txHash
      }));
      
      // Generate chart data
      const chartData = await generateChartData(earnings);
      
      // Calculate revenue sources
      const revenueSources = calculateRevenueSources(earnings);
      
      setEarningsData({
        totalEarnings: earningsResult.totalEarnings,
        availableBalance: earningsResult.availableBalance,
        pendingBalance: [], // No pending balance in current implementation
        dailyEarnings: chartData.daily,
        monthlyEarnings: chartData.monthly,
        revenueBySource: revenueSources,
        recentTransactions: earnings.slice(0, 10)
      });
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time event listening
  useEffect(() => {
    if (!account) return;

    const cleanup = listenToSplitEvents((event) => {
      // Only update if this event is for the current user
      if (event.creator.toLowerCase() === account.toLowerCase()) {
        console.log('New revenue split event:', event);
        // Reload earnings data to reflect the new transaction
        loadEarningsData();
      }
    });

    return cleanup;
  }, [account, listenToSplitEvents]);

  const generateChartData = async (transactions: EarningsTransaction[]) => {
    const now = Date.now();
    const timeframes = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };

    const cutoff = now - timeframes[selectedTimeframe];
    const relevantTransactions = transactions.filter(tx => tx.timestamp >= cutoff);

    // Group by day
    const dailyData: { [key: string]: number } = {};
    relevantTransactions.forEach(tx => {
      const date = new Date(tx.timestamp).toISOString().split('T')[0];
      const amount = parseFloat(tx.amount.amount) / Math.pow(10, tx.amount.decimals);
      dailyData[date] = (dailyData[date] || 0) + amount;
    });

    const daily = Object.entries(dailyData).map(([date, earnings]) => ({
      date,
      earnings,
      token: selectedToken
    }));

    // Group by month for monthly view
    const monthlyData: { [key: string]: number } = {};
    relevantTransactions.forEach(tx => {
      const month = new Date(tx.timestamp).toISOString().substring(0, 7);
      const amount = parseFloat(tx.amount.amount) / Math.pow(10, tx.amount.decimals);
      monthlyData[month] = (monthlyData[month] || 0) + amount;
    });

    const monthly = Object.entries(monthlyData).map(([date, earnings]) => ({
      date,
      earnings,
      token: selectedToken
    }));

    return { daily, monthly };
  };

  const calculateRevenueSources = (transactions: EarningsTransaction[]): RevenueSource[] => {
    const sources: { [key: string]: number } = {};
    let total = 0;

    transactions.forEach(tx => {
      const amount = parseFloat(tx.amount.amount) / Math.pow(10, tx.amount.decimals);
      sources[tx.type] = (sources[tx.type] || 0) + amount;
      total += amount;
    });

    const colors = ['#FF0050', '#7928CA', '#00D4FF', '#50E3C2'];
    
    return Object.entries(sources).map(([source, amount], index) => ({
      source: source.replace('_', ' ').toUpperCase(),
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: colors[index % colors.length]
    }));
  };

  const formatTokenBalance = (balance: TokenBalance): string => {
    return formatTokenAmount(balance.amount, balance.decimals, balance.symbol);
  };

  const formatCurrency = (amount: number, token: string): string => {
    return `${amount.toFixed(4)} ${token}`;
  };

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border rounded w-1/3"></div>
          <div className="h-64 bg-border rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-border rounded"></div>
            <div className="h-32 bg-border rounded"></div>
            <div className="h-32 bg-border rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!earningsData) {
    return (
      <div className="bg-card p-6 rounded-2xl text-center">
        <p className="text-text-secondary">Unable to load earnings data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-satoshi font-bold">Earnings Dashboard</h2>
        <div className="flex gap-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as '7d' | '30d' | '90d')}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <div className="min-w-[200px]">
            <TokenSelector
              selectedToken={selectedToken}
              onTokenSelect={setSelectedToken}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Total Earnings</h3>
          <div className="space-y-1">
            {earningsData.totalEarnings.map((balance, index) => (
              <p key={index} className="text-2xl font-bold text-primary flex items-center gap-2">
                {balance.icon && <span>{balance.icon}</span>}
                {formatTokenBalance(balance)}
              </p>
            ))}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Available to Withdraw</h3>
          <div className="space-y-1">
            {earningsData.availableBalance.map((balance, index) => (
              <p key={index} className="text-2xl font-bold text-green-400 flex items-center gap-2">
                {balance.icon && <span>{balance.icon}</span>}
                {formatTokenBalance(balance)}
              </p>
            ))}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Revenue Split</h3>
          <div className="text-sm text-text-secondary">
            <p>Creator: <span className="text-green-400 font-medium">90%</span></p>
            <p>Platform: <span className="text-primary font-medium">10%</span></p>
          </div>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-lg font-satoshi font-bold mb-4">Earnings Over Time</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={earningsData.dailyEarnings}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF0050" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#7928CA" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#37373b" />
              <XAxis dataKey="date" stroke="#A0A0A0" />
              <YAxis stroke="#A0A0A0" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1A1D', border: 'none', borderRadius: '10px' }}
                formatter={(value: number) => [formatCurrency(value, selectedToken), 'Earnings']}
              />
              <Area 
                type="monotone" 
                dataKey="earnings" 
                stroke="#FF0050" 
                fillOpacity={1} 
                fill="url(#colorEarnings)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-lg font-satoshi font-bold mb-4">Revenue by Source</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={earningsData.revenueBySource}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="amount"
                >
                  {earningsData.revenueBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value, selectedToken)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {earningsData.revenueBySource.map((source, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: source.color }}
                  ></div>
                  <span>{source.source}</span>
                </div>
                <span className="font-medium">{source.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-lg font-satoshi font-bold mb-4">Recent Transactions</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {earningsData.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{tx.type.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-text-secondary text-xs">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-medium">
                    +{formatTokenBalance(tx.amount)}
                  </p>
                  <a 
                    href={`https://etherscan.io/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs hover:underline"
                  >
                    View TX
                  </a>
                </div>
              </div>
            ))}
            {earningsData.recentTransactions.length === 0 && (
              <p className="text-text-secondary text-center py-4">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;