import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { NavigationProps, NFTTierStats } from '../types';
import { dashboardChartData } from '../lib/mock-data';
import { useWallet } from '../lib/WalletProvider';
import { useNFTAccess } from '../hooks/useNFTAccess';
import Button from './ui/Button';
import SubscriptionManager from './SubscriptionManager';
import NFTTierCreationForm from './NFTTierCreationForm';
import EarningsDashboard from './EarningsDashboard';
import WithdrawalInterface from './WithdrawalInterface';
import SupportedTokensDisplay from './SupportedTokensDisplay';

const CreatorDashboard: React.FC<NavigationProps> = ({ onNavigate }) => {
    const { account } = useWallet();
    const { getTierStats } = useNFTAccess();
    const [showNFTForm, setShowNFTForm] = useState(false);
    const [nftStats, setNftStats] = useState<NFTTierStats[]>([]);
    const [loadingNFTStats, setLoadingNFTStats] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'withdrawal'>('overview');

    useEffect(() => {
        const loadNFTStats = async () => {
            if (!account) return;
            
            try {
                setLoadingNFTStats(true);
                const stats = await getTierStats(account);
                setNftStats(stats);
            } catch (err) {
                console.error('Error loading NFT stats:', err);
            } finally {
                setLoadingNFTStats(false);
            }
        };

        loadNFTStats();
    }, [account, getTierStats]);

    const handleNFTCreated = (txHash: string) => {
        setShowNFTForm(false);
        alert(`NFT tier created successfully! Transaction hash: ${txHash}`);
        // Reload stats after creation
        if (account) {
            getTierStats(account).then(setNftStats).catch(console.error);
        }
    };

    const renderGradient = () => (
        <defs>
            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF0050" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#7928CA" stopOpacity={0.1}/>
            </linearGradient>
        </defs>
    );

    const handleWithdrawalComplete = (txHash: string) => {
        alert(`Withdrawal completed! Transaction hash: ${txHash}`);
        // Optionally refresh data or show success message
    };

    return (
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 mb-16 sm:mb-20 md:mb-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-satoshi font-bold mb-6 sm:mb-8">Creator Dashboard</h1>
            
            {/* Tab Navigation - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mb-6 sm:mb-8 bg-card rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-3 sm:px-4 py-2 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
                        activeTab === 'overview'
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:text-white'
                    }`}
                >
                    <span className="sm:hidden">📊</span>
                    <span className="hidden sm:inline">Overview</span>
                    <span className="sm:hidden ml-2">Overview</span>
                </button>
                <button
                    onClick={() => setActiveTab('earnings')}
                    className={`px-3 sm:px-4 py-2 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
                        activeTab === 'earnings'
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:text-white'
                    }`}
                >
                    <span className="sm:hidden">💰</span>
                    <span className="hidden sm:inline">Earnings Analytics</span>
                    <span className="sm:hidden ml-2">Analytics</span>
                </button>
                <button
                    onClick={() => setActiveTab('withdrawal')}
                    className={`px-3 sm:px-4 py-2 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
                        activeTab === 'withdrawal'
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:text-white'
                    }`}
                >
                    <span className="sm:hidden">🏦</span>
                    <span className="hidden sm:inline">Withdraw Funds</span>
                    <span className="sm:hidden ml-2">Withdraw</span>
                </button>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'overview' && (
                <>
                    {/* Earnings Graph - Mobile Optimized */}
                    <div className="bg-card p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-xl font-satoshi font-bold mb-3 sm:mb-4">Earnings (7 days)</h2>
                         <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <span className="text-xl sm:text-2xl">🗽</span>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">1,843 LIB</p>
                         </div>
                        <div style={{ width: '100%', height: window.innerWidth < 640 ? 250 : 300 }}>
                            <ResponsiveContainer>
                                <AreaChart 
                                    data={dashboardChartData} 
                                    margin={{ 
                                        top: 10, 
                                        right: window.innerWidth < 640 ? 10 : 30, 
                                        left: window.innerWidth < 640 ? 0 : 0, 
                                        bottom: 0 
                                    }}
                                >
                                   {renderGradient()}
                                    <CartesianGrid strokeDasharray="3 3" stroke="#37373b" />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#A0A0A0" 
                                        fontSize={window.innerWidth < 640 ? 10 : 12}
                                        interval={window.innerWidth < 640 ? 1 : 0}
                                    />
                                    <YAxis 
                                        stroke="#A0A0A0" 
                                        fontSize={window.innerWidth < 640 ? 10 : 12}
                                        width={window.innerWidth < 640 ? 40 : 60}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#1A1A1D', 
                                            border: 'none', 
                                            borderRadius: '10px',
                                            fontSize: window.innerWidth < 640 ? '12px' : '14px'
                                        }} 
                                    />
                                    <Area type="monotone" dataKey="earnings" stroke="#FF0050" fillOpacity={1} fill="url(#colorEarnings)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Subscription Management */}
                    <div className="mb-8">
                        <SubscriptionManager mode="creator" />
                    </div>

                    {/* NFT Tier Management - Mobile Optimized */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4">
                            <h2 className="text-lg sm:text-xl font-satoshi font-bold">NFT Access Tiers</h2>
                            <Button
                                variant="primary"
                                onClick={() => setShowNFTForm(!showNFTForm)}
                                className="w-full sm:w-auto text-sm sm:text-base min-h-[44px]"
                            >
                                {showNFTForm ? 'Cancel' : 'Create NFT Tier'}
                            </Button>
                        </div>
                        
                        {showNFTForm && (
                            <div className="mb-6">
                                <NFTTierCreationForm
                                    onSuccess={handleNFTCreated}
                                    onCancel={() => setShowNFTForm(false)}
                                />
                            </div>
                        )}

                        {/* NFT Stats - Mobile Optimized */}
                        <div className="bg-card p-4 sm:p-6 rounded-2xl">
                            <h3 className="font-satoshi font-bold text-base sm:text-lg mb-3 sm:mb-4">NFT Tier Statistics</h3>
                            {loadingNFTStats ? (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-border rounded"></div>
                                    <div className="h-4 bg-border rounded"></div>
                                    <div className="h-4 bg-border rounded"></div>
                                </div>
                            ) : nftStats.length > 0 ? (
                                <div className="space-y-3">
                                    {nftStats.map((stat) => (
                                        <div key={stat.tierId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm p-3 sm:p-0 bg-background/30 sm:bg-transparent rounded-lg sm:rounded-none">
                                            <span className="font-medium">Tier #{stat.tierId}</span>
                                            <div className="flex flex-wrap gap-2 sm:gap-4 text-text-secondary">
                                                <span className="bg-card px-2 py-1 rounded text-xs sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">{stat.holderCount} holders</span>
                                                <span className="bg-card px-2 py-1 rounded text-xs sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">{stat.totalMinted}/{stat.maxSupply} minted</span>
                                                <span className="text-green-400 bg-card px-2 py-1 rounded text-xs sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">{stat.revenueEth} ETH</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-secondary text-sm">No NFT tiers created yet. Create your first tier to get started!</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Cards - Mobile Optimized */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {/* Recent Uploads */}
                        <div className="bg-card p-4 sm:p-6 rounded-2xl">
                            <h3 className="font-satoshi font-bold text-base sm:text-lg mb-3 sm:mb-4">Recent Uploads</h3>
                            <div className="space-y-2 sm:space-y-3">
                                {['Video Title 1', 'Video Title 2', 'Video Title 3'].map((title, i) => (
                                    <div key={title} className="flex items-center justify-between text-xs sm:text-sm p-2 sm:p-0 bg-background/20 sm:bg-transparent rounded sm:rounded-none">
                                        <span className="truncate pr-2">{title}</span>
                                        <span className="text-green-400 flex items-center gap-1 flex-shrink-0">
                                            <span>🗽</span>
                                            <span>{25 + i * 5} LIB</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* NFT Holders Summary */}
                        <div className="bg-card p-4 sm:p-6 rounded-2xl">
                            <h3 className="font-satoshi font-bold text-base sm:text-lg mb-3 sm:mb-4">NFT Holders</h3>
                            {loadingNFTStats ? (
                                <div className="animate-pulse space-y-2">
                                    <div className="h-4 bg-border rounded"></div>
                                    <div className="h-4 bg-border rounded"></div>
                                    <div className="h-4 bg-border rounded"></div>
                                </div>
                            ) : nftStats.length > 0 ? (
                                <div className="space-y-2">
                                    {nftStats.slice(0, 3).map((stat) => (
                                        <p key={stat.tierId} className="text-xs sm:text-sm p-2 sm:p-0 bg-background/20 sm:bg-transparent rounded sm:rounded-none">
                                            Tier #{stat.tierId}: {stat.holderCount} holders
                                        </p>
                                    ))}
                                    {nftStats.length > 3 && (
                                        <p className="text-text-secondary text-xs sm:text-sm">
                                            +{nftStats.length - 3} more tiers
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-text-secondary text-xs sm:text-sm">No NFT holders yet</p>
                            )}
                        </div>

                        {/* Quick Actions - Mobile Optimized */}
                         <div className="bg-card p-4 sm:p-6 rounded-2xl flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                            <h3 className="font-satoshi font-bold text-base sm:text-lg mb-3 sm:mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
                                <Button 
                                    variant="primary" 
                                    className="w-full flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[44px]"
                                    onClick={() => setActiveTab('withdrawal')}
                                >
                                    <span>💰</span>
                                    <span className="hidden sm:inline">Withdraw Earnings</span>
                                    <span className="sm:hidden">Withdraw</span>
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    className="w-full flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[44px]"
                                    onClick={() => setActiveTab('earnings')}
                                >
                                    <span>📊</span>
                                    <span className="hidden sm:inline">View Analytics</span>
                                    <span className="sm:hidden">Analytics</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Supported Tokens Display */}
                    <div className="mt-8">
                        <SupportedTokensDisplay />
                    </div>
                </>
            )}

            {activeTab === 'earnings' && (
                <EarningsDashboard />
            )}

            {activeTab === 'withdrawal' && (
                <WithdrawalInterface onWithdrawalComplete={handleWithdrawalComplete} />
            )}
        </div>
    );
};

export default CreatorDashboard;
