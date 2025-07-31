import React from 'react';
import { Page, NavigationProps } from '../types';
import Logo from './icons/Logo';
import { useWallet, WalletType } from '../lib/WalletProvider';
import EthIcon from './icons/EthIcon';
import { SUPPORTED_CHAINS } from '../lib/blockchainConfig';
import { Chain } from '../lib/web3-types';
import { StableBalanceDisplay } from './StableBalanceDisplay';
import { formatToken, shortenAddress } from '../utils/formatters';
import { NetworkBadge, NetworkStatus } from './ui/NetworkBadge';

interface HeaderProps extends NavigationProps {
    currentPage: Page;
    onOpenRegistrationModal: () => void; // New prop
    isWatchPage?: boolean; // New prop to detect watch page
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage, onOpenRegistrationModal, isWatchPage = false }) => {
    const navItems = [
        { page: Page.Explore, label: 'Explore' },
        { page: Page.Upload, label: 'Upload' },
        { page: Page.Dashboard, label: 'Dashboard' },
        { page: Page.CreatorProfile, label: 'Creator Profile' }, // New navigation item
        { page: Page.Governance, label: 'Governance' }, // Add governance navigation
        { page: Page.Gamification, label: '🎮 Gamification' }, // Add gamification navigation
        { page: Page.Admin, label: '🎬 Admin' }, // Add admin panel for video management
        { page: Page.Profile, label: 'Wallet Profile' }, // Renamed existing Profile
    ];
    const { account, chainId, currentChain, balance, isConnected, isConnecting, connect, disconnect, switchNetwork, error } = useWallet();

    const getNetworkName = (chain: Chain | undefined | null) => {
        return chain ? chain.name : 'Unknown Network';
    };

    const handleSwitchNetwork = async (targetChainId: number) => {
        await switchNetwork(targetChainId);
    };

    const ethBalance = balance.find(b => b.symbol === (currentChain?.nativeCurrency.symbol || 'ETH'));

    return (
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex items-center justify-between h-20 overflow-visible">
                    <div className="flex-shrink-0 cursor-pointer" onClick={() => onNavigate(Page.Explore)}>
                       <Logo />
                    </div>
                    <nav className="hidden md:flex md:space-x-8">
                        {navItems.map(item => (
                            <button
                                key={item.page}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onNavigate(item.page);
                                }}
                                className={`
                                    font-satoshi text-lg font-medium transition-all duration-200 relative px-3 py-2 rounded-lg
                                    ${currentPage === item.page 
                                        ? 'text-primary bg-primary/10 shadow-sm' 
                                        : 'text-white/90 hover:text-white hover:bg-white/5'
                                    }
                                    ${currentPage === item.page 
                                        ? 'after:absolute after:bottom-[-8px] after:left-1/2 after:transform after:-translate-x-1/2 after:w-8 after:h-0.5 after:bg-primary after:rounded-full after:shadow-sm' 
                                        : 'hover:after:absolute hover:after:bottom-[-8px] hover:after:left-1/2 hover:after:transform hover:after:-translate-x-1/2 hover:after:w-4 hover:after:h-0.5 hover:after:bg-white/30 hover:after:rounded-full hover:after:transition-all hover:after:duration-200'
                                    }
                                `}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className="flex items-center space-x-4">
                        {isConnected ? (
                            <>
                                {/* Action buttons - moved to top right */}
                                <div className="hidden md:flex items-center space-x-2">
                                    <button
                                        onClick={onOpenRegistrationModal}
                                        className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors text-sm"
                                    >
                                        Register as Creator
                                    </button>
                                    <button
                                        onClick={disconnect}
                                        className="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                                    >
                                        Disconnect
                                    </button>
                                </div>

                                {/* Mobile simplified view */}
                                <div className="md:hidden flex flex-col items-end space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <NetworkBadge
                                            networkName={getNetworkName(currentChain)}
                                            isConnected={isConnected}
                                            isConnecting={isConnecting}
                                            size="small"
                                            variant="compact"
                                            showNetworkName={false}
                                        />
                                        <span className="text-primary font-mono text-xs bg-primary/10 px-2 py-1 rounded whitespace-nowrap">
                                            {shortenAddress(account || '')}
                                        </span>
                                    </div>
                                    <button
                                        onClick={disconnect}
                                        className="px-3 py-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 transition-colors"
                                    >
                                        Disconnect
                                    </button>
                                </div>
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
                        
                        <div className="md:hidden">
                          {/* Mobile menu button could go here */}
                        </div>
                    </div>
                </div>
                
                {/* Network and Balance info - moved below navigation */}
                {isConnected && (
                    <div className="hidden md:flex justify-center mt-2 pb-3 relative z-40">
                        <div className="flex items-center space-x-6 bg-card p-3 rounded-lg text-sm">
                            {/* Network Status */}
                            <div className="relative group z-50">
                                <NetworkStatus
                                    networkName={getNetworkName(currentChain)}
                                    isConnected={isConnected}
                                    isConnecting={isConnecting}
                                />
                                <div className={`absolute left-0 mt-2 w-56 bg-card border border-gray-700 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[9999] max-h-64 overflow-y-auto`}>
                                    {SUPPORTED_CHAINS.map((chain, index) => (
                                        <button
                                            key={chain.chainId}
                                            onClick={() => handleSwitchNetwork(chain.chainId)}
                                            className={`block w-full text-left px-4 py-3 text-sm text-white hover:bg-primary/30 transition-colors ${
                                                chainId === chain.chainId ? 'bg-primary/20 border-l-2 border-primary' : ''
                                            } ${index === 0 ? 'rounded-t-md' : ''} ${index === SUPPORTED_CHAINS.length - 1 ? 'rounded-b-md' : ''}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{chain.name}</span>
                                                <span className="text-xs text-gray-400">{chain.nativeCurrency.symbol}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Balance */}
                            <div className="flex items-center space-x-3">
                                <span className="text-text-secondary">Balance:</span>
                                <StableBalanceDisplay 
                                    tokenSymbol="LIB" 
                                    size="small" 
                                    className="text-white font-medium"
                                />
                                <span className="text-text-secondary">|</span>
                                <StableBalanceDisplay 
                                    tokenSymbol={currentChain?.nativeCurrency.symbol || 'ETH'} 
                                    size="small" 
                                    className="text-white font-medium"
                                />
                            </div>
                            
                            {/* Wallet Address */}
                            <div className="flex items-center space-x-2">
                                <span className="text-primary font-mono text-sm bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20 whitespace-nowrap">
                                    {shortenAddress(account || '')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {error && (
                <div className="bg-red-800 text-white text-center py-2">
                    Error: {error.message} (Code: {error.code})
                </div>
            )}
            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm p-2 flex justify-around md:hidden z-50 border-t border-gray-800/50">
                {navItems.map(item => (
                    <button
                        key={item.page}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onNavigate(item.page);
                        }}
                        className={`
                            flex flex-col items-center font-satoshi text-xs font-medium transition-all duration-200 w-full p-2 rounded-lg relative
                            ${currentPage === item.page 
                                ? 'text-primary bg-primary/15 shadow-sm scale-105' 
                                : 'text-white/90 hover:text-white hover:bg-white/5 hover:scale-102'
                            }
                            ${currentPage === item.page 
                                ? 'after:absolute after:top-0 after:left-1/2 after:transform after:-translate-x-1/2 after:w-8 after:h-0.5 after:bg-primary after:rounded-full after:shadow-sm' 
                                : 'hover:after:absolute hover:after:top-0 hover:after:left-1/2 hover:after:transform hover:after:-translate-x-1/2 hover:after:w-4 hover:after:h-0.5 hover:after:bg-white/30 hover:after:rounded-full hover:after:transition-all hover:after:duration-200'
                            }
                        `}
                    >
                        <span className="truncate max-w-full">{item.label}</span>
                    </button>
                ))}
                {isConnected && (
                    <>
                        <button
                            onClick={onOpenRegistrationModal}
                            className="flex flex-col items-center font-satoshi text-xs font-medium transition-all duration-200 w-full p-2 rounded-lg text-primary hover:text-white bg-primary/15 hover:bg-primary/25 hover:scale-102"
                        >
                            <span className="truncate max-w-full">Register</span>
                        </button>
                        <button
                            onClick={disconnect}
                            className="flex flex-col items-center font-satoshi text-xs font-medium transition-all duration-200 w-full p-2 rounded-lg text-red-400 hover:text-red-200 bg-red-900/20 hover:bg-red-900/30 hover:scale-102"
                        >
                            <span className="truncate max-w-full">Disconnect</span>
                        </button>
                    </>
                )}
            </nav>
        </header>
    );
};

export default Header;
