import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useWallet } from '../lib/WalletProvider';
import { useRevenueSplitter } from '../hooks/useRevenueSplitter';
import { TokenBalance } from '../types';
import { formatTokenAmount } from '../lib/tokenConfig';
import TokenSelector from './TokenSelector';
// import Button from './ui/Button';

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
  const { getCreatorEarnings, listenToSplitEvents, loading: _revenueLoading } = useRevenueSplitter();
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

    // If no transactions, generate sample data for demo
    if (relevantTransactions.length === 0) {
      const sampleDaily = [];
      const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        sampleDaily.push({
          date,
          earnings: Math.random() * 0.05, // Random earnings between 0-0.05 ETH
          token: selectedToken
        });
      }
      
      return { daily: sampleDaily, monthly: sampleDaily };
    }

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

    // If no transactions, show sample revenue sources
    if (total === 0) {
      return [
        {
          source: 'CONTENT PURCHASE',
          amount: 0.025,
          percentage: 60,
          color: '#FF0050'
        },
        {
          source: 'SUBSCRIPTION',
          amount: 0.015,
          percentage: 30,
          color: '#7928CA'
        },
        {
          source: 'NFT MINT',
          amount: 0.005,
          percentage: 10,
          color: '#00D4FF'
        }
      ];
    }

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
      {/* Header with Controls - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-satoshi font-bold">Earnings Dashboard</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as '7d' | '30d' | '90d')}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm min-h-[44px] w-full sm:w-auto"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <div className="min-w-full sm:min-w-[200px]">
            <TokenSelector
              selectedToken={selectedToken}
              onTokenSelect={setSelectedToken}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-card p-4 sm:p-6 rounded-2xl">
          <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-2">Total Earnings</h3>
          <div className="space-y-1">
            {earningsData.totalEarnings.map((balance, index) => (
              <p key={index} className="text-lg sm:text-xl lg:text-2xl font-bold text-primary flex items-center gap-2">
                {balance.icon && <span className="text-base sm:text-lg lg:text-xl">{balance.icon}</span>}
                <span className="truncate">{formatTokenBalance(balance)}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-2xl">
          <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-2">Available to Withdraw</h3>
          <div className="space-y-1">
            {earningsData.availableBalance.map((balance, index) => (
              <p key={index} className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400 flex items-center gap-2">
                {balance.icon && <span className="text-base sm:text-lg lg:text-xl">{balance.icon}</span>}
                <span className="truncate">{formatTokenBalance(balance)}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-2xl sm:col-span-2 lg:col-span-1">
          <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-2">Revenue Split</h3>
          <div className="text-sm text-text-secondary grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-0">
            <p>Creator: <span className="text-green-400 font-medium">90%</span></p>
            <p>Platform: <span className="text-primary font-medium">10%</span></p>
          </div>
        </div>
      </div>

      {/* Earnings Chart - Mobile Optimized */}
      <div className="bg-card p-4 sm:p-6 rounded-2xl">
        <h3 className="text-base sm:text-lg font-satoshi font-bold mb-3 sm:mb-4">Earnings Over Time</h3>
        <div style={{ width: '100%', height: window.innerWidth < 640 ? 250 : window.innerWidth < 1024 ? 280 : 300 }}>
          <ResponsiveContainer>
            <AreaChart 
              data={earningsData.dailyEarnings}
              margin={{ 
                top: 10, 
                right: window.innerWidth < 640 ? 5 : 20, 
                left: window.innerWidth < 640 ? 5 : 10, 
                bottom: 0 
              }}
            >
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF0050" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#7928CA" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#37373b" />
              <XAxis 
                dataKey="date" 
                stroke="#A0A0A0" 
                fontSize={window.innerWidth < 640 ? 10 : 12}
                interval={window.innerWidth < 640 ? 1 : 0}
                angle={window.innerWidth < 640 ? -45 : 0}
                textAnchor={window.innerWidth < 640 ? 'end' : 'middle'}
                height={window.innerWidth < 640 ? 60 : 30}
              />
              <YAxis 
                stroke="#A0A0A0" 
                fontSize={window.innerWidth < 640 ? 10 : 12}
                width={window.innerWidth < 640 ? 35 : 60}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1A1A1D', 
                  border: 'none', 
                  borderRadius: '10px',
                  fontSize: window.innerWidth < 640 ? '12px' : '14px'
                }}
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

      {/* Revenue Sources - Mobile Optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card p-4 sm:p-6 rounded-2xl">
          <h3 className="text-base sm:text-lg font-satoshi font-bold mb-3 sm:mb-4">Revenue by Source</h3>
          <div style={{ width: '100%', height: window.innerWidth < 640 ? 180 : 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={earningsData.revenueBySource}
                  cx="50%"
                  cy="50%"
                  innerRadius={window.innerWidth < 640 ? 45 : 60}
                  outerRadius={window.innerWidth < 640 ? 65 : 80}
                  dataKey="amount"
                >
                  {earningsData.revenueBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, selectedToken)}
                  contentStyle={{
                    fontSize: window.innerWidth < 640 ? '12px' : '14px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-3 sm:mt-4">
            {earningsData.revenueBySource.map((source, index) => (
              <div key={index} className="flex items-center justify-between text-xs sm:text-sm p-2 sm:p-0 bg-background/20 sm:bg-transparent rounded sm:rounded-none">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: source.color }}
                  ></div>
                  <span className="truncate">{source.source}</span>
                </div>
                <span className="font-medium flex-shrink-0">{source.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions - Mobile Optimized */}
        <div className="bg-card p-4 sm:p-6 rounded-2xl">
          <h3 className="text-base sm:text-lg font-satoshi font-bold mb-3 sm:mb-4">Recent Transactions</h3>
          <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
            {earningsData.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm p-3 sm:p-0 bg-background/20 sm:bg-transparent rounded sm:rounded-none">
                <div className="flex-1">
                  <p className="font-medium">{tx.type.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-text-secondary text-xs">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex justify-between sm:block sm:text-right">
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
              <p className="text-text-secondary text-center py-4 text-xs sm:text-sm">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;