import React from 'react';
import { Page, NavigationProps } from '../types';
import Logo from './icons/Logo';
import { useWallet, WalletType } from '../lib/WalletProvider';
import EthIcon from './icons/EthIcon';
import { SUPPORTED_CHAINS } from '../lib/blockchainConfig';
import { Chain } from '../lib/web3-types';

interface HeaderProps extends NavigationProps {
    currentPage: Page;
    onOpenRegistrationModal: () => void; // New prop
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage, onOpenRegistrationModal }) => {
    const navItems = [
        { page: Page.Explore, label: 'Explore' },
        { page: Page.Upload, label: 'Upload' },
        { page: Page.Dashboard, label: 'Dashboard' },
        { page: Page.CreatorProfile, label: 'Creator Profile' }, // New navigation item
        { page: Page.Profile, label: 'Wallet Profile' }, // Renamed existing Profile
    ];
    const { account, chainId, currentChain, balance, isConnected, isConnecting, connect, disconnect, switchNetwork, error } = useWallet();

    const truncateAddress = (address: string | null) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const getNetworkName = (chain: Chain | undefined | null) => {
        return chain ? chain.name : 'Unknown Network';
    };

    const handleSwitchNetwork = async (targetChainId: number) => {
        await switchNetwork(targetChainId);
    };

    const ethBalance = balance.find(b => b.symbol === (currentChain?.nativeCurrency.symbol || 'ETH'));

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
                                    <div className="relative group">
                                        <button
                                            className="text-primary hover:underline"
                                        >
                                            {getNetworkName(currentChain)}
                                        </button>
                                        <div className="absolute left-0 mt-2 w-48 bg-card border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                            {SUPPORTED_CHAINS.map((chain) => (
                                                <button
                                                    key={chain.chainId}
                                                    onClick={() => handleSwitchNetwork(chain.chainId)}
                                                    className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-primary/20"
                                                >
                                                    {chain.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-text-secondary">|</span>
                                    <span className="text-text-secondary">Balance:</span>
                                    {ethBalance && (
                                        <div className="flex items-center">
                                            <EthIcon className="w-4 h-4 mr-1" />
                                            <span>{parseFloat(ethBalance.balance).toFixed(4)} {ethBalance.symbol}</span>
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
                        ) : ( // If not connected
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => connect(WalletType.MetaMask)}
                              disabled={isConnecting}
                              className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                            >
                              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                            </button>
                          </div>
                        )}
                        
                        {/* Register as Creator button - show when connected */}
                        {isConnected && (
                          <button
                            onClick={onOpenRegistrationModal}
                            className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors"
                          >
                            Register as Creator
                          </button>
                        )}
                        <div className="md:hidden">
                          {/* Mobile menu button could go here */}
                        </div>
                    </div>
                </div>
            </div>
            {error && (
                <div className="bg-red-800 text-white text-center py-2">
                    Error: {error.message} (Code: {error.code})
                </div>
            )}
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
                    <>
                        <button
                            onClick={onOpenRegistrationModal}
                            className="flex flex-col items-center font-satoshi text-xs font-medium transition-colors w-full p-1 rounded-md text-primary hover:text-white bg-primary/10"
                        >
                            <span>Register</span>
                        </button>
                        <button
                            onClick={disconnect}
                            className="flex flex-col items-center font-satoshi text-xs font-medium transition-colors w-full p-1 rounded-md text-red-400 hover:text-red-200 bg-red-900/20"
                        >
                            <span>Disconnect</span>
                        </button>
                    </>
                )}
            </nav>
        </header>
    );
};

export default Header;
