import React, { useState } from 'react';
import { useWallet, WalletType } from '../lib/WalletProvider';
import { useRealTimeBalances } from '../hooks/useRealTimeBalances';
import EthIcon from './icons/EthIcon';
import UsdcIcon from './icons/UsdcIcon';
import LibertyIcon from './icons/LibertyIcon';
import Button from './ui/Button';
import Modal from './ui/Modal';
import WalletConnectIcon from './icons/WalletConnectIcon';
import CheckIcon from './icons/CheckIcon';
import UserNFTCollection from './UserNFTCollection';

const WalletProfile: React.FC = () => {
    const { account, isConnected, connect, disconnect } = useWallet();
    const { balances, isLoading, error, refreshBalances } = useRealTimeBalances();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRegionBlocked, setIsRegionBlocked] = useState(false);

    const TokenIcon = ({ symbol }: { symbol: string }) => {
        switch (symbol) {
            case 'ETH': 
            case 'MATIC':
            case 'BNB':
            case 'AVAX':
                return <EthIcon className="w-8 h-8" />;
            case 'USDC': 
            case 'USDT':
                return <UsdcIcon className="w-8 h-8" />;
            case 'LIB': 
            case 'LIBERTY':
                return <LibertyIcon className="w-8 h-8 text-primary" />;
            default: return <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold">{symbol.charAt(0)}</div>;
        }
    };

    const handleConnectWallet = async () => {
        if (isConnected) {
            await disconnect();
        } else {
            // Try to connect with MetaMask first, fallback to other wallets
            try {
                if ((window as any).ethereum?.isMetaMask) {
                    await connect(WalletType.MetaMask);
                } else if ((window as any).ethereum) {
                    await connect(WalletType.MetaMask); // Generic ethereum provider
                } else {
                    // Show error if no wallet detected
                    alert('No wallet detected. Please install MetaMask or another compatible wallet.');
                    return;
                }
            } catch (error) {
                console.error('Failed to connect wallet:', error);
            }
        }
        setIsModalOpen(false);
    };

    const formatBalance = (balance: string, decimals: number) => {
        const numBalance = parseFloat(balance);
        if (numBalance === 0) return '0.0000';
        if (numBalance >= 1000) {
            return `${(numBalance / 1000).toFixed(2)}K`;
        }
        return numBalance.toFixed(4);
    };

    return (
        <div className="container mx-auto max-w-2xl py-12 px-4 mb-20 md:mb-0">
            <h1 className="text-4xl font-satoshi font-bold mb-8">Wallet & Profile</h1>

            <div className="bg-card p-6 rounded-2xl mb-8">
                 <h2 className="text-xl font-satoshi font-bold mb-4">Connected Wallet</h2>
                 <div className="flex items-center justify-between">
                    <p className="text-sm md:text-base text-text-secondary truncate">
                        {isConnected && account 
                            ? `${account.slice(0, 6)}...${account.slice(-4)}`
                            : 'Not connected'
                        }
                    </p>
                    <Button 
                        variant={isConnected ? "outline" : "primary"} 
                        onClick={handleConnectWallet}
                        disabled={isLoading}
                    >
                        {isConnected ? 'Disconnect' : 'Connect Wallet'}
                    </Button>
                 </div>
            </div>

            <div className="bg-card p-6 rounded-2xl mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-satoshi font-bold">Token Balances</h2>
                    <Button 
                        variant="ghost" 
                        onClick={refreshBalances}
                        disabled={isLoading || !isConnected}
                        className="text-sm"
                    >
                        {isLoading ? '🔄' : '↻'} Refresh
                    </Button>
                </div>
                
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}
                
                {!isConnected ? (
                    <div className="text-center py-8">
                        <p className="text-text-secondary">Connect your wallet to view token balances</p>
                    </div>
                ) : isLoading && balances.length === 0 ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-border rounded-full"></div>
                                    <div>
                                        <div className="h-4 bg-border rounded w-12 mb-1"></div>
                                        <div className="h-3 bg-border rounded w-16"></div>
                                    </div>
                                </div>
                                <div className="h-4 bg-border rounded w-20"></div>
                            </div>
                        ))}
                    </div>
                ) : balances.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-text-secondary">No token balances found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {balances.map(token => (
                            <div key={`${token.symbol}-${token.token}`} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <TokenIcon symbol={token.symbol} />
                                    <div>
                                        <p className="font-bold">{token.symbol}</p>
                                        <p className="text-sm text-text-secondary">
                                            {token.symbol === 'LIB' ? 'LIBERTY' : token.symbol}
                                        </p>
                                    </div>
                                </div>
                                <p className="font-mono">
                                    {formatBalance(token.balance, token.decimals)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* NFT Collection */}
            <div className="mb-8">
                <UserNFTCollection />
            </div>

            <div className="bg-card p-6 rounded-2xl">
                <h2 className="text-xl font-satoshi font-bold mb-4">Profile Settings</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium">KYC Status</span>
                            <p className="text-sm text-text-secondary">Identity verification status</p>
                        </div>
                        <span className="flex items-center gap-2 text-green-400 font-bold">
                            <CheckIcon className="w-5 h-5" />
                            Verified
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium">Enable Region Blocking</span>
                            <p className="text-sm text-text-secondary">Block access from restricted regions</p>
                        </div>
                        <button
                            onClick={() => setIsRegionBlocked(!isRegionBlocked)}
                            className={`${
                                isRegionBlocked ? 'bg-primary' : 'bg-gray-600'
                            } relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card`}
                            role="switch"
                            aria-checked={isRegionBlocked}
                        >
                            <span
                                aria-hidden="true"
                                className={`${
                                    isRegionBlocked ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                        </button>
                    </div>
                    {isConnected && (
                        <div className="pt-4 border-t border-border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-medium">Wallet Connection</span>
                                    <p className="text-sm text-text-secondary">Manage your wallet connection</p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setIsModalOpen(true)}
                                    className="text-sm"
                                >
                                    Manage
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Connect Wallet">
                <div className="text-center">
                    <p className="text-text-secondary mb-6">
                        {isConnected 
                            ? "Are you sure you want to disconnect your wallet?"
                            : "Scan with WalletConnect or your mobile wallet."
                        }
                    </p>
                    {!isConnected && (
                        <div className="bg-white p-4 rounded-lg inline-block mb-6">
                            <WalletConnectIcon className="w-48 h-48" />
                        </div>
                    )}
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleConnectWallet}>
                            {isConnected ? 'Disconnect' : 'Connect'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default WalletProfile;