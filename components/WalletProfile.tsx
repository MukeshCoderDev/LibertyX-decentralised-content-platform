import React, { useState } from 'react';
import { walletBalances } from '../lib/mock-data';
import EthIcon from './icons/EthIcon';
import UsdcIcon from './icons/UsdcIcon';
import LibertyIcon from './icons/LibertyIcon';
import Toggle from './ui/Toggle';
import Button from './ui/Button';
import Modal from './ui/Modal';
import WalletConnectIcon from './icons/WalletConnectIcon';
import CheckIcon from './icons/CheckIcon';

const WalletProfile: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRegionBlocked, setIsRegionBlocked] = useState(false);

    const TokenIcon = ({ symbol }: { symbol: string }) => {
        switch (symbol) {
            case 'ETH': return <EthIcon className="w-8 h-8" />;
            case 'USDC': return <UsdcIcon className="w-8 h-8" />;
            case 'LIBERTY': return <LibertyIcon className="w-8 h-8 text-primary" />;
            default: return null;
        }
    };

    return (
        <div className="container mx-auto max-w-2xl py-12 px-4 mb-20 md:mb-0">
            <h1 className="text-4xl font-satoshi font-bold mb-8">Wallet & Profile</h1>

            <div className="bg-card p-6 rounded-2xl mb-8">
                 <h2 className="text-xl font-satoshi font-bold mb-4">Connected Wallet</h2>
                 <div className="flex items-center justify-between">
                    <p className="text-sm md:text-base text-text-secondary truncate">0x1234...abcd</p>
                    <Button variant="outline" onClick={() => setIsModalOpen(true)}>Connect Wallet</Button>
                 </div>
            </div>

            <div className="bg-card p-6 rounded-2xl mb-8">
                <h2 className="text-xl font-satoshi font-bold mb-4">Token Balances</h2>
                <div className="space-y-4">
                    {walletBalances.map(token => (
                        <div key={token.symbol} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <TokenIcon symbol={token.symbol} />
                                <div>
                                    <p className="font-bold">{token.symbol}</p>
                                    <p className="text-sm text-text-secondary">${token.usdValue.toFixed(2)}</p>
                                </div>
                            </div>
                            <p className="font-mono">{token.balance.toFixed(4)}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-card p-6 rounded-2xl">
                <h2 className="text-xl font-satoshi font-bold mb-4">Profile Settings</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-medium">KYC Status</span>
                        <span className="flex items-center gap-2 text-green-400 font-bold">
                            <CheckIcon className="w-5 h-5" />
                            Verified
                        </span>
                    </div>
                    <Toggle label="Enable Region Blocking" enabled={isRegionBlocked} setEnabled={setIsRegionBlocked} />
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Connect Wallet">
                <div className="text-center">
                    <p className="text-text-secondary mb-6">Scan with WalletConnect or your mobile wallet.</p>
                    <div className="bg-white p-4 rounded-lg inline-block">
                        {/* Placeholder for QR Code */}
                        <WalletConnectIcon className="w-48 h-48" />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default WalletProfile;