import React from 'react';
import { Page, NavigationProps, TokenBalance } from '../types';
import Logo from './icons/Logo';
import { useWallet, WalletType } from '../lib/WalletProvider';
import EthIcon from './icons/EthIcon';

interface HeaderProps extends NavigationProps {
    currentPage: Page;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage }) => {
    const navItems = [
        { page: Page.Explore, label: 'Explore' },
        { page: Page.Upload, label: 'Upload' },
        { page: Page.Dashboard, label: 'Dashboard' },
        { page: Page.Profile, label: 'Profile' },
    ];
const { account, chainId, balance, isConnected, isConnecting, connect, disconnect, switchNetwork } = useWallet();

const truncateAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const getNetworkName = (id: number | null) => {
    switch (id) {
        case 1: return 'Ethereum Mainnet';
        case 11155111: return 'Sepolia';
        case 137: return 'Polygon';
        case 80001: return 'Polygon Mumbai';
        case 56: return 'BNB Chain';
        case 97: return 'BNB Testnet';
        case 42161: return 'Arbitrum';
        case 421613: return 'Arbitrum Goerli';
        case 10: return 'Optimism';
        case 420: return 'Optimism Goerli';
        case 43114: return 'Avalanche';
        case 43113: return 'Avalanche Fuji';
        default: return 'Unknown Network';
    }
};

const handleSwitchNetwork = async () => {
    // For now, hardcode to Sepolia as it's the primary testnet for the project
    const sepoliaChainId = 11155111;
    await switchNetwork(sepoliaChainId);
};

const ethBalance = balance.find(b => b.symbol === 'ETH');

return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
                <div className="flex-shrink-0 cursor-pointer" onClick={() => onNavigate(Page.Explore)}>
                   <Logo />
                </div>
                <nav className="hidden md:flex md:space-x-8">
                    {navItems.map(item => (
                        <button
                            key={item.page}
                            onClick={() => onNavigate(item.page)}
                            className={`font-satoshi text-lg font-medium transition-colors ${currentPage === item.page ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div className="flex items-center space-x-4">
                    {isConnected ? (
                        <>
                            <div className="hidden md:flex items-center space-x-2 bg-card p-2 rounded-lg text-sm">
                                <span className="text-text-secondary">Network:</span>
                                <button
                                    onClick={handleSwitchNetwork}
                                    className="text-primary hover:underline"
                                    title="Click to switch to Sepolia"
                                >
                                    {getNetworkName(chainId)}
                                </button>
                                <span className="text-text-secondary">|</span>
                                <span className="text-text-secondary">Balance:</span>
                                {ethBalance && (
                                    <div className="flex items-center">
                                        <EthIcon className="w-4 h-4 mr-1" />
                                        <span>{parseFloat(ethBalance.amount).toFixed(4)} ETH</span>
                                    </div>
                                )}
                                <span className="text-text-secondary">|</span>
                                <span className="text-primary">{truncateAddress(account)}</span>
                                <button
                                    onClick={disconnect}
                                    className="ml-2 px-3 py-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 transition-colors"
                                >
                                    Disconnect
                                </button>
                            </div>
                            <button
                                onClick={disconnect}
                                className="md:hidden px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                            >
                                Disconnect
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => connect(WalletType.MetaMask)}
                            disabled={isConnecting}
                            className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    )}
                    <div className="md:hidden">
                        {/* Mobile menu button could go here */}
                    </div>
                </div>
            </div>
        </div>
        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card p-2 flex justify-around md:hidden z-50 border-t border-gray-800">
            {navItems.map(item => (
                <button
                    key={item.page}
                    onClick={() => onNavigate(item.page)}
                    className={`flex flex-col items-center font-satoshi text-xs font-medium transition-colors w-full p-1 rounded-md ${currentPage === item.page ? 'text-primary bg-primary/10' : 'text-text-secondary hover:text-white'}`}
                >
                    <span>{item.label}</span>
                </button>
            ))}
            {isConnected && (
                <button
                    onClick={disconnect}
                    className="flex flex-col items-center font-satoshi text-xs font-medium transition-colors w-full p-1 rounded-md text-red-400 hover:text-red-200 bg-red-900/20"
                >
                    <span>Disconnect</span>
                </button>
            )}
        </nav>
    </header>
);
};

export default Header;
