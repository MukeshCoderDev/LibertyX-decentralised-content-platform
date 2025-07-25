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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 md:mb-0">
            <h1 className="text-4xl font-satoshi font-bold mb-8">Creator Dashboard</h1>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-8 bg-card rounded-lg p-1">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'overview'
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:text-white'
                    }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('earnings')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'earnings'
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:text-white'
                    }`}
                >
                    Earnings Analytics
                </button>
                <button
                    onClick={() => setActiveTab('withdrawal')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'withdrawal'
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:text-white'
                    }`}
                >
                    Withdraw Funds
                </button>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'overview' && (
                <>
                    {/* Earnings Graph */}
                    <div className="bg-card p-6 rounded-2xl mb-8">
                        <h2 className="text-xl font-satoshi font-bold mb-4">Earnings (7 days)</h2>
                         <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl">🗽</span>
                            <p className="text-4xl font-bold text-primary">1,843 LIB</p>
                         </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <AreaChart data={dashboardChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                   {renderGradient()}
                                    <CartesianGrid strokeDasharray="3 3" stroke="#37373b" />
                                    <XAxis dataKey="name" stroke="#A0A0A0" />
                                    <YAxis stroke="#A0A0A0" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1A1A1D', border: 'none', borderRadius: '10px' }} />
                                    <Area type="monotone" dataKey="earnings" stroke="#FF0050" fillOpacity={1} fill="url(#colorEarnings)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Subscription Management */}
                    <div className="mb-8">
                        <SubscriptionManager mode="creator" />
                    </div>

                    {/* NFT Tier Management */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-satoshi font-bold">NFT Access Tiers</h2>
                            <Button
                                variant="primary"
                                onClick={() => setShowNFTForm(!showNFTForm)}
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

                        {/* NFT Stats */}
                        <div className="bg-card p-6 rounded-2xl">
                            <h3 className="font-satoshi font-bold text-lg mb-4">NFT Tier Statistics</h3>
                            {loadingNFTStats ? (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-border rounded"></div>
                                    <div className="h-4 bg-border rounded"></div>
                                    <div className="h-4 bg-border rounded"></div>
                                </div>
                            ) : nftStats.length > 0 ? (
                                <div className="space-y-3">
                                    {nftStats.map((stat) => (
                                        <div key={stat.tierId} className="flex items-center justify-between text-sm">
                                            <span>Tier #{stat.tierId}</span>
                                            <div className="flex gap-4 text-text-secondary">
                                                <span>{stat.holderCount} holders</span>
                                                <span>{stat.totalMinted}/{stat.maxSupply} minted</span>
                                                <span className="text-green-400">{stat.revenueEth} ETH</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-secondary">No NFT tiers created yet. Create your first tier to get started!</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Cards */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Recent Uploads */}
                        <div className="bg-card p-6 rounded-2xl">
                            <h3 className="font-satoshi font-bold text-lg mb-4">Recent Uploads</h3>
                            <div className="space-y-3">
                                {['Video Title 1', 'Video Title 2', 'Video Title 3'].map((title, i) => (
                                    <div key={title} className="flex items-center justify-between text-sm">
                                        <span>{title}</span>
                                        <span className="text-green-400 flex items-center gap-1">
                                            <span>🗽</span>
                                            <span>{25 + i * 5} LIB</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* NFT Holders Summary */}
                        <div className="bg-card p-6 rounded-2xl">
                            <h3 className="font-satoshi font-bold text-lg mb-4">NFT Holders</h3>
                            {loadingNFTStats ? (
                                <div className="animate-pulse space-y-2">
                                    <div className="h-4 bg-border rounded"></div>
                                    <div className="h-4 bg-border rounded"></div>
                                    <div className="h-4 bg-border rounded"></div>
                                </div>
                            ) : nftStats.length > 0 ? (
                                <div className="space-y-2">
                                    {nftStats.slice(0, 3).map((stat) => (
                                        <p key={stat.tierId}>
                                            Tier #{stat.tierId}: {stat.holderCount} holders
                                        </p>
                                    ))}
                                    {nftStats.length > 3 && (
                                        <p className="text-text-secondary text-sm">
                                            +{nftStats.length - 3} more tiers
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-text-secondary">No NFT holders yet</p>
                            )}
                        </div>

                        {/* Quick Withdraw */}
                         <div className="bg-card p-6 rounded-2xl flex flex-col justify-between">
                            <h3 className="font-satoshi font-bold text-lg mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Button 
                                    variant="primary" 
                                    className="w-full flex items-center justify-center gap-2"
                                    onClick={() => setActiveTab('withdrawal')}
                                >
                                    <span>💰</span>
                                    <span>Withdraw Earnings</span>
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    className="w-full flex items-center justify-center gap-2"
                                    onClick={() => setActiveTab('earnings')}
                                >
                                    <span>📊</span>
                                    <span>View Analytics</span>
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
